const _ = require('lodash')
const knex = require('knex')
const dbConfig = require('../config').db
const mysql = knex(dbConfig)
let undef
module.exports = {
  con: mysql,

  getTables: function(tableNames, cb) {
    let matchAll = tableNames.length === 1 && tableNames[0] === '*';

    mysql
      .select('table_name')
      .from('information_schema.tables')
      .where('table_schema', dbConfig.connection.database)
      .where('table_type', 'BASE TABLE')
      .catch(cb)
      .then(function(tbls) {
        tbls = tbls.map(tbls => tbls.table_name)
        if (!matchAll) {
          tbls = tbls.filter(function(tbl) {
            return tableNames.includes(tbl)
          });
        }
        cb(null, tbls);
      });
  },

  getTableStructure: function(tableName) {
    return mysql
      .select([
        'table_name',
        'column_name',
        'ordinal_position',
        'is_nullable',
        'data_type',
        'column_key',
        'column_type',
        'column_comment',
        'extra'
      ])
      .from('information_schema.columns')
      .where({
        table_schema: dbConfig.connection.database,
        table_name: tableName
      })
      .orderBy('ordinal_position', 'asc')
  },


  getTableComment: function(tableName, cb) {
    mysql
      .first('table_comment AS comment')
      .from('information_schema.tables')
      .where({
        table_schema: dbConfig.connection.database,
        table_name: tableName
      })
      .catch(cb)
      .then(function(info) {
        cb(null, info ? info.comment || undef : undef);
      });
  },
  
  hasDuplicateValues: function(table, column, cb) {
    mysql
      .count(column + ' as hasSameValues')
      .from(table)
      .groupBy(column)
      .having('hasSameValues', '>', 1)
      .limit(1)
      .catch(cb)
      .then(function(info) {
        cb(null, (info || []).length > 0);
      });
  },

  close: function(cb) {
    mysql.destroy(cb);
  }
}