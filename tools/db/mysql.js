const _ = require('lodash')
const Sequelize = require('sequelize')
const { connection } = require('../cli').db
const { host, port, user, password, database } = connection
const mysql = new Sequelize(`mysql://${user}:${password}@${host}:${port}/${database}`, {
  logging: false,
  operatorsAliases: Sequelize.Op
})
mysql.authenticate()
  .then(() => { console.log('Connection has been established successfully.') })
  .catch(err => { console.error('Unable to connect to the database:', err) })

module.exports = {
  con: mysql,

  getTables: async function (tableNames) {
    let matchAll = tableNames.length === 1 && tableNames[0] === '*';
    const tables = await mysql.query("SELECT table_name FROM information_schema.tables WHERE table_schema=? AND table_type=?", {
      replacements: [connection.database, 'BASE TABLE'],
      type: mysql.QueryTypes.SELECT
    })
    let tbls = tables.map(tbls => tbls.table_name)
    if (!matchAll) {
      tbls = tbls.filter(function (tbl) {
        return tableNames.includes(tbl)
      })
    } else {
      return tbls
    }
  },

  getTableStructure: async function (tableName) {
    return await mysql.query(`SELECT table_name,column_name,ordinal_position,is_nullable,data_type,column_key,column_type,column_comment,extra
    FROM information_schema.columns WHERE table_schema=? AND table_name=? ORDER BY ordinal_position ASC`, {
        replacements: [connection.database, tableName],
        type: mysql.QueryTypes.SELECT
      })
  },


  getTableComment: async function (tableName, cb) {
    const result = await mysql.query(`SELECT table_comment
    FROM information_schema.tables WHERE table_schema=? AND table_name=?`, {
        replacements: [connection.database, tableName],
        type: mysql.QueryTypes.SELECT
      })
    console.log(result)
    // mysql
    //   .first('table_comment AS comment')
    //   .from('information_schema.tables')
    //   .where({
    //     table_schema: connection.database,
    //     table_name: tableName
    //   })
    //   .catch(cb)
    //   .then(function(info) {
    //     cb(null, info ? info.comment || undef : undef);
    //   });
  },

  hasDuplicateValues: function (table, column, cb) {
    // mysql
    //   .count(column + ' as hasSameValues')
    //   .from(table)
    //   .groupBy(column)
    //   .having('hasSameValues', '>', 1)
    //   .limit(1)
    //   .catch(cb)
    //   .then(function (info) {
    //     cb(null, (info || []).length > 0);
    //   });
  },

  close: function () {
    mysql.close();
  }
}