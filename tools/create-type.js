const _ = require('lodash')
const path = require('path')
const fse = require('fs-extra')
const config = require('../config')
const getDataType = require('./data-type')

function createType(tableData) {
  let codeIndex = ``
  let codeTypes = ``
  for (var i = 0; i < tableData.length; i++) {
    let rows = tableData[i]
    let code = `import {args} from '../query-schema'\n`
    code += `const sdl = ${'`'}\n`
    let tableName = _.camelCase(rows[0].table_name)
    let tableUpper = _.upperFirst(tableName)

    codeIndex += `import ${tableName} from './${tableName}'\n`
    codeTypes += `types += ${tableName}\n`

    // // generate type
    code += `type ${tableUpper} {\n`
    for (let row of rows) {
      let colname = (row.column_key === 'PRI' && row.extra === 'auto_increment')?'id': _.camelCase(row.column_name)
      code += `  ${colname}: ${getDataType(row.data_type)}\n`
    }
    code += `}\n`

    // // generate input 
    code += `input ${tableUpper+'Input'} {\n`
    for (let row of rows) {
      let colname = (row.column_key === 'PRI' && row.extra === 'auto_increment') ? 'id' : _.camelCase(row.column_name)
      code += `  ${colname}: ${getDataType(row.data_type)}${row.is_nullable=='YES'?'':'!'}\n`
    }
    code += '}\n'

    // // generate filter 
    code += `input ${tableUpper+'Filter'} {\n`
    code += `  OR: [${tableUpper+'Filter'}]\n`
    code += `  AND: [${tableUpper+'Filter'}]\n`
    for (let row of rows) {
      let colname = (row.column_key === 'PRI' && row.extra === 'auto_increment')?'id': _.camelCase(row.column_name)
      code += `  ${colname}: ${getDataType(row.data_type)}\n`
      code += `  _${colname}: QueryOperator\n`
    }
    code += `}`
    code += '`\nexport default sdl\n\n'

    let outputFileType = path.resolve(path.join(config.outputDir, 'src','type', tableName+'.js'))
    fse.ensureFileSync(outputFileType)
    fse.writeFileSync(outputFileType, code);
  }
  codeIndex += '\nlet types = ``\n'
  codeIndex += codeTypes
  codeIndex += '\nexport default types'
  let outputIndexType = path.resolve(path.join(config.outputDir, 'src','type', 'index.js'))
  fse.ensureFileSync(outputIndexType)
  fse.writeFileSync(outputIndexType, codeIndex);
}
module.exports = createType