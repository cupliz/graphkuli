const _ = require('lodash')
const path = require('path')
const fse = require('fs-extra')
const config = require('../config')

function createMutationSchema(tableData) {
  let code = ``
  let codeQuery = ``
  let codeResolver = ``
  code += `import { resolveMutation } from './_resolver'\n`
  code += `import { mutationSchema as customSchema, mutationResolver as customResolver } from './custom-schema'\n`
  codeQuery += 'let schema = `\ntype Mutation{\n'
  for (var i = 0; i < tableData.length; i++) {
    let tableName = _.camelCase(tableData[i][0].table_name)
    let tableUpper = _.upperFirst(tableName)
    codeQuery += `  ${tableName}(id: ID, do: String, input: ${tableUpper}Input): ${tableUpper}\n`
  }
  codeQuery += `}${'` + customSchema'}\n`

  codeResolver += `let resolver = {\n`
  codeResolver += `  Mutation: {\n`
  for (var i = 0; i < tableData.length; i++) {
    let tableName = _.camelCase(tableData[i][0].table_name)
    let tableUpper = _.upperFirst(tableName)
    codeResolver += `    ${tableName}: resolveMutation('${tableUpper}'),\n`
  }
  codeResolver += `  },\n}\n`
  codeResolver += `Object.assign(resolver.Mutation, customResolver)\n`
  code = code+codeQuery+codeResolver+`export default { schema, resolver }`
  let outputMutationSchema = path.resolve(path.join(config.outputDir, 'src', 'mutation-schema.js'))
  fse.ensureFileSync(outputMutationSchema)
  fse.writeFileSync(outputMutationSchema, code);
}
module.exports = createMutationSchema