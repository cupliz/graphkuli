const _ = require('lodash')
const fse = require('fs-extra')
const config = require('./tools/cli')
const createDir = require('./tools/create-dir')
const createMap = require('./tools/create-map')
const createType = require('./tools/create-type')
const createQuerySchema = require('./tools/create-querySchema')
const createMutationSchema = require('./tools/create-mutationSchema')

if (Object.keys(config).length) {
  const db = require('./tools/db/' + config.db.client)
  db.getTables('*', function(err, tables) {
    let tableStructure = []
    for (var i = 0; i < tables.length; i++) {
      let tableName = tables[i]
      tableStructure.push(db.getTableStructure(tableName))
    }
    Promise.all(tableStructure).then(function(data) {
      createDir()
      createQuerySchema(data)
      createMutationSchema(data)
      createType(data)
      createMap(data)
      db.close()
      console.log(`Done! To start your Graphkuli API:\n$ cd ${config.outputDir}\n$ npm install\n$ npm start`)
    }).catch(err => {
      console.log(err)
    })
  })
}