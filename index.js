#! /usr/bin/env node
const _ = require('lodash')
const config = require('./tools/cli')
const db = require(`./tools/db/${config.db.client}`)
const createDir = require('./tools/create-dir')
const createMap = require('./tools/create-map')
const createType = require('./tools/create-type')
const createQuerySchema = require('./tools/create-querySchema')
const createMutationSchema = require('./tools/create-mutationSchema')

const init = async function () {
  try {
    const tables = await db.getTables('*')
    let data = []
    for (var i = 0; i < tables.length; i++) {
      let tableName = tables[i]
      const item = await db.getTableStructure(tableName)
      data.push(item)
    }
    createDir(config)
    createQuerySchema(config, data)
    createMutationSchema(config, data)
    createType(config, data)
    createMap(config, data)
    db.close()
    console.log(`Done! To start your Graphkuli API:\n$ cd ${config.outputDir}\n$ npm install\n$ npm start`)
  } catch (error) {
    console.log(error)
  }
}
if (Object.keys(config).length) {
  init()
}