const mockKnex = require('mock-knex');
const _knex = require('knex');

const { tryLoadingDefaultConfiguration } = require('./utils');

const knex = _knex(tryLoadingDefaultConfiguration());

let tracker;

beforeAll(() => {
  mockKnex.mock(knex);
  tracker = mockKnex.getTracker();
});

beforeEach(() => {
  tracker.install();
});

afterEach(() => {
  tracker.uninstall();
});

function setupMockQuery({ responses = [] } = {}) {
  const sql = [];

  tracker.on('query', query => {
    let boundSQL = query.sql;

    query.bindings.forEach((binding, i) => {
      boundSQL = boundSQL.replace(`$${i + 1}`, '?');
    });

    const rawQuery = knex.raw(boundSQL, query.bindings).toQuery();

    sql.push(rawQuery);

    const response = responses[rawQuery];

    query.response(response || []);
  });

  return {
    getSQL: () => sql.join('\n'),
  };
}

function snapshotMigration({ up, down }) {
  describe('#up', () => {
    it('should match SQL snapshot', async () => {
      const { getSQL } = setupMockQuery();

      await up(knex);

      expect(getSQL()).toMatchSnapshot();
    });
  });

  describe('#down', () => {
    it('should match SQL snapshot', async () => {
      const { getSQL } = setupMockQuery();

      await down(knex);

      expect(getSQL()).toMatchSnapshot();
    });
  });
}

module.exports = {
  setupMockQuery,
  snapshotMigration,
};
