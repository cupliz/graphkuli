const _ = require('lodash')
const path = require('path')
const fse = require('fs-extra')
const config = require('../config')

function createQuerySchema(tableData) {
  let code = ``
  let codeQuery = ``
  let codeResolver = ``
  code += `import { resolveQuery } from './_resolver'\n`
  code += `import { querySchema as customSchema, queryResolver as customResolver } from './custom-schema'\n`
  code += `export let args = 'id: Int, limit: Int, offset: Int, after: String, before: String, first: Int, last: Int, orderBy: String'\n`
  codeQuery += 'let schema = `\ntype Query{\n'
  for (var i = 0; i < tableData.length; i++) {
    let tableName = _.camelCase(tableData[i][0].table_name)
    let tableUpper = _.upperFirst(tableName)
    codeQuery += `  ${tableName}(${'${args}'}, filter: ${tableUpper+'Filter'}): [${tableUpper}]\n`
  }
  codeQuery += `}\ninput QueryOperator{`
  codeQuery += `\n  like: String\n  lt: String\n  lte: String\n  gt: String\n  gte: String\n  in: String\n  notin: String\n`
  codeQuery += `}${'` + customSchema'}\n`

  codeResolver += `let resolver = {\n`
  codeResolver += `  Query: {\n`
  for (var i = 0; i < tableData.length; i++) {
    let tableName = _.camelCase(tableData[i][0].table_name)
    let tableUpper = _.upperFirst(tableName)
    codeResolver += `    ${tableName}: resolveQuery('${tableUpper}'),\n`
  }
  codeResolver += `  },\n}\n`
  codeResolver += `Object.assign(resolver.Query, customResolver)\n`
  code = code+codeQuery+codeResolver+`export default { schema, resolver }`

  let outputQuerySchema = path.resolve(path.join(config.outputDir, 'src', 'query-schema.js'))
  fse.ensureFileSync(outputQuerySchema)
  fse.writeFileSync(outputQuerySchema, code);
}
module.exports = createQuerySchema