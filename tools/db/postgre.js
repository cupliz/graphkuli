const knex = require('knex')
const config = require('./config')
var postgre = knex({
  client: 'pg',
  version: '7.2',
  connection: config.dbCon
})
const pgSchemas = ['pg_catalog', 'pg_statistic', 'information_schema']

module.exports = {
  con: postgre,
  getTables: function(tableNames, tblCb) {
    var matchAll = tableNames.length === 1 && tableNames[0] === '*';

    pg('information_schema.tables')
      .distinct('table_name')
      .where({
        table_catalog: opts.db,
        table_type: 'BASE TABLE'
      })
      .whereNotIn('table_schema', pgSchemas)
      .then(function(tbls) {
        tbls = pluck(tbls, 'table_name');

        if (!matchAll) {
          tbls = tbls.filter(function(tbl) {
            return contains(tableNames, tbl);
          });
        }

        tblCb(null, tbls);
      })
      .catch(tblCb);
  },

  getTableComment: function(tableName, tblCb) {
    var q = 'SELECT obj_description(?::regclass, \'pg_class\') AS table_comment';
    pg.raw(q, [tableName]).then(function(info) {
      tblCb(null, ((info || [])[0] || {}).table_comment || undef);
    }).catch(tblCb);
  },

  getTableStructure: function(tableName, tblCb) {
    pg.select('table_name', 'column_name', 'ordinal_position', 'is_nullable', 'data_type', 'udt_name')
      .from('information_schema.columns AS c')
      .where({
        table_catalog: opts.db,
        table_name: tableName
      })
      .whereNotIn('table_schema', pgSchemas)
      .orderBy('ordinal_position', 'asc')
      .catch(tblCb)
      .then(function(columns) {
        var enumQueries = uniq(columns.filter(function(col) {
          return col.data_type === 'USER-DEFINED';
        }).map(function(col) {
          return 'enum_range(NULL::' + col.udt_name + ') AS ' + col.udt_name;
        })).join(', ');

        pg.raw('SELECT ' + (enumQueries || '1 AS "1"')).then(function(enumRes) {
          var enums = enumRes.rows[0];

          var subQuery = pg.select('constraint_name')
            .from('information_schema.table_constraints')
            .where({
              table_catalog: opts.db,
              table_name: tableName,
              constraint_type: 'PRIMARY KEY'
            })
            .whereNotIn('table_schema', pgSchemas);

          pg.first('column_name AS primary_key')
            .from('information_schema.key_column_usage')
            .where({
              table_catalog: opts.db,
              table_name: tableName,
              constraint_name: subQuery
            })
            .whereNotIn('table_schema', pgSchemas)
            .then(function(pk) {
              var pkCol = (pk || {}).primary_key;
              columns = columns.map(function(col) {
                var isUserDefined = col.data_type === 'USER-DEFINED';
                col.columnKey = col.column_name === pkCol ? 'PRI' : null;
                col.columnType = isUserDefined ? enums[col.udt_name] : null;
                return col;
              });

              tblCb(null, (columns || []).map(camelCaseKeys));
            });
        }).catch(tblCb);
      });
  },

  hasDuplicateValues: function(table, column, callback) {
    pg
      .select(column)
      .from(table)
      .groupBy(column)
      .havingRaw('count(' + column + ') > 1')
      .limit(1)
      .catch(callback)
      .then(function(info) {
        callback(null, (info || []).length > 0);
      });
  },

  close: function(tblCb) {
    pg.destroy(tblCb);
  }
}