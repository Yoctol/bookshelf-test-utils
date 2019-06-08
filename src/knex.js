const _knex = require('knex');

const { tryLoadingDefaultConfiguration } = require('./utils');

const knex = _knex(tryLoadingDefaultConfiguration());

module.exports = knex;
