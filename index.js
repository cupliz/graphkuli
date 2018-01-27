const _ = require('lodash')
const path = require('path')
const fse = require('fs-extra')
const config = require('./config')
const db = require('./extra/' + config.db.client)
const createDir = require('./tools/create-dir')
const createMap = require('./tools/create-map')
const createType = require('./tools/create-type')
const createQuerySchema = require('./tools/create-querySchema')
const createMutationSchema = require('./tools/create-mutationSchema')

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
    console.log(`Graphkuli is ready to serve.. to start your project:\n$ cd ${config.outputDir}\n$ npm install\n$ npm start`)
  }).catch(err => {
    console.log(err)
  })
})
