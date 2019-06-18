const faker = require('faker');
const flatMap = require('lodash/flatMap');
const get = require('lodash/get');
const set = require('lodash/set');

const modelDefinitions = {};
const modelStates = {};
const afterCreating = {};

class FactoryBuilder {
  constructor(Model) {
    this._Model = Model;
    this._name = 'default';
    this._activeStates = [];
  }

  /**
   * Set the amount of models you wish to create / make.
   *
   */
  times(amount) {
    this._amount = amount;
    return this;
  }

  /**
   * Set the states to be applied to the model.
   *
   */
  states(...states) {
    this._activeStates = states;
    return this;
  }

  /**
   * Get the state attributes.
   *
   */
  stateAttributes(state, attributes) {
    const stateAttributes = get(modelStates, `${this._Model.name}.${state}`);

    if (typeof stateAttributes === 'function') {
      return stateAttributes(this._faker, attributes);
    }

    return stateAttributes;
  }

  /**
   * Apply the active states to the model definition.
   *
   */
  applyStates(definition, attributes = {}) {
    return this._activeStates.reduce(async (acc, state) => {
      if (!get(modelStates, `${this._Model.name}.${state}`)) {
        throw new Error(
          `Unable to locate [${state}] state for [${this._Model.name}].`
        );
      }

      return {
        ...(await acc),
        ...(await this.stateAttributes(state, attributes)),
      };
    }, Promise.resolve(definition));
  }

  /**
   * Get a raw attributes object for the model.
   *
   */
  async getRawAttributes(attributes = {}) {
    const getAttributes = get(
      modelDefinitions,
      `${this._Model.name}.${this._name}`
    );

    if (!getAttributes) {
      throw new Error(
        `Unable to locate factory with name [${this._Model.name}] [${
          this._name
        }].`
      );
    }

    const definition = await getAttributes(faker, attributes);

    return {
      ...(await this.applyStates(definition, attributes)),
      ...attributes,
    };
  }

  /**
   * Make an instance of the model with the given attributes.
   *
   */
  async makeInstance(attributes = {}) {
    return this._Model.forge(await this.getRawAttributes(attributes));
  }

  /**
   * Create a collection of models.
   *
   */
  async make(attributes = {}) {
    if (!this._amount) {
      return this.makeInstance(attributes);
    }

    return this._Model.collection(
      await Promise.all(
        new Array(this._amount).fill(0).map(() => this.makeInstance(attributes))
      )
    );
  }

  /**
   * Create a collection of models and persist them to the database.
   *
   */
  async create(attributes = {}) {
    if (!this._amount) {
      const instance = await this.makeInstance(attributes);
      await instance.save(null, { method: 'insert' });

      await this.callAfterCreating(this._Model.collection([instance]));

      return instance;
    }

    const results = this._Model.collection(
      await Promise.all(
        new Array(this._amount).fill(0).map(async () =>
          (await this.makeInstance(attributes)).save(null, {
            method: 'insert',
          })
        )
      )
    );

    await this.callAfterCreating(results);

    return results;
  }

  /**
   * Run after creating callbacks on a collection of models.
   *
   */
  callAfterCreating(collection) {
    return this.callAfter(afterCreating, collection);
  }

  /**
   * Call after callbacks for each model and state.
   *
   */
  callAfter(afterCallbacks, collection) {
    const states = this._activeStates;
    return Promise.all(
      flatMap(collection.models, model =>
        flatMap(states, async state => {
          await this.callAfterCallbacks(afterCallbacks, model, state);
        })
      )
    );
  }

  /**
   * Call after callbacks for each model and state.
   *
   */
  callAfterCallbacks(afterCallbacks, model, state) {
    if (!get(afterCallbacks, `${this._Model.name}.${state}`)) {
      return;
    }

    return Promise.all(
      get(afterCallbacks, `${this._Model.name}.${state}`).map(callback =>
        callback(model, faker)
      )
    );
  }
}

function factory(Model) {
  return new FactoryBuilder(Model);
}

/**
 * Define a class with a given set of attributes.
 *
 */
factory.define = (Model, getAttributes, name = 'default') => {
  set(modelDefinitions, `${Model.name}.${name}`, getAttributes);
  return this;
};

/**
 * Define a state with a given set of attributes.
 *
 */
factory.state = (Model, state, attributes) => {
  set(modelStates, `${Model.name}.${state}`, attributes);
  return this;
};

/**
 * Define a callback to run after creating a model.
 *
 */
factory.afterCreating = (Model, callback, name = 'default') => {
  set(afterCreating, `${Model.name}.${name}`, [
    ...get(afterCreating, `${Model.name}.${name}`, []),
    callback,
  ]);
  return this;
};

/**
 * Define a callback to run after creating a model with given state.
 *
 */
factory.afterCreatingState = (Model, state, callback) => {
  return factory.afterCreating(Model, callback, state);
};

module.exports = factory;
