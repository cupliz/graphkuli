const _ = require('lodash')
const path = require('path')
const fse = require('fs-extra')
const config = require('../config')

function createMap(tableData) {
  let structure = {}
  let code = ``
  for (var i = 0; i < tableData.length; i++) {
    let map = eachMap(tableData[i])
    structure[map.name] = map
  }
  code += `const map = ${JSON.stringify(structure, null, 2)}`
  code += `\nexport default map `

  let outputFile = path.resolve(path.join(config.outputDir, 'src', 'structure.js'))
  fse.ensureFileSync(outputFile)
  fse.writeFileSync(outputFile, code);
}

function eachMap(tableData) {
  let map = {}
  map.name = _.camelCase(tableData[0].table_name)
  map.table = tableData[0].table_name
  map.aliases = {}
  for (let i = 0; i < tableData.length; i++) {
    let row = tableData[i]
    let columnNameCamelCase = _.camelCase(row.column_name)
    if (row.column_key === 'PRI' && row.extra === 'auto_increment') {
      map.primaryKey = row.column_name
      map.aliases[row.column_name] = 'id'
    } else {
      map.aliases[row.column_name] = columnNameCamelCase
    }
    map.referenceMap = {}
  }
  return map
}
module.exports = createMap