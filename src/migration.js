const mockKnex = require('mock-knex');

const knex = require('./knex');

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
    getSQL: ({ withSemicolon = true } = {}) =>
      sql.join(`${withSemicolon ? ';' : ''}\n`),
  };
}

function snapshotMigration({ up, down }, options = {}) {
  describe('#up', () => {
    it('should match SQL snapshot', async () => {
      const { getSQL } = setupMockQuery();

      await up(knex);

      expect(getSQL(options)).toMatchSnapshot();
    });
  });

  describe('#down', () => {
    it('should match SQL snapshot', async () => {
      const { getSQL } = setupMockQuery();

      await down(knex);

      expect(getSQL(options)).toMatchSnapshot();
    });
  });
}

module.exports = {
  knex,

  setupMockQuery,
  snapshotMigration,
};
