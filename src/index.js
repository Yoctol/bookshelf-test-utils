const factory = require('./factory');
const knex = require('./knex');

function getAllViews() {
  return knex('pg_catalog.pg_views')
    .whereRaw('schemaname = current_schema()')
    .select('viewname');
}

function getAllTables() {
  return knex('pg_catalog.pg_tables')
    .whereRaw('schemaname = current_schema()')
    .select('tablename');
}

function dropAllViews(views) {
  return knex.raw(
    `DROP VIEW ${views.map(view => `"${view}"`).join(',')} CASCADE`
  );
}

function truncateAllTables(tables) {
  return knex.raw(
    `TRUNCATE TABLE ${tables.map(table => `"${table}"`).join(',')} CASCADE`
  );
}

function dropAllTables(tables) {
  return knex.raw(
    `DROP TABLE ${tables.map(table => `"${table}"`).join(',')} CASCADE`
  );
}

async function dropAllTablesAndViews() {
  const views = await getAllViews();
  if (views.length > 0) {
    await dropAllViews(views.map(view => view.viewname));
  }

  const tables = await getAllTables();
  if (tables.length > 0) {
    await dropAllTables(tables.map(table => table.tablename));
  }
}

async function refreshSQLDatabase({ seed = false, truncate = true } = {}) {
  if (truncate) {
    const tables = await getAllTables();

    const nonKnexTables = tables.filter(
      table => !table.tablename.startsWith('knex_')
    );

    if (nonKnexTables.length > 0) {
      await truncateAllTables(nonKnexTables.map(table => table.tablename));
    }
  } else {
    await dropAllTablesAndViews();

    await knex.migrate.latest();
  }

  if (seed) {
    await knex.seed.run();
  }
}

function destroyDatabaseConnections() {
  return knex.destroy();
}

module.exports = {
  getAllViews,
  getAllTables,
  dropAllViews,
  truncateAllTables,
  dropAllTables,
  dropAllTablesAndViews,
  refreshSQLDatabase,
  refreshDatabase: refreshSQLDatabase,
  destroyDatabaseConnections,

  factory,

  knex,
};
