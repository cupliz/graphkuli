import express from 'express'
import cors from 'cors'
import path from 'path'
import favicon from 'serve-favicon'
import expressGraphQL from 'express-graphql'
import { makeExecutableSchema } from 'graphql-tools'
import config from './src/config'
import mutation from './src/mutation-schema'
import query from './src/query-schema'
import extra from './core/extra-schema'
import types from './src/type/index'
import basicAuth from './src/basic-auth'

let typeDefs = types + query.schema + mutation.schema + extra
let resolvers = Object.assign(query.resolver, mutation.resolver)
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

const app = express()
app.set('port', process.env.PORT || config.port)
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use('/', cors(), basicAuth, expressGraphQL({
  schema: schema,
  graphiql: true,
}))
app.use(function(req, res, next) {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'))
})
app.listen(app.get('port'), () => {
  console.log('GraphiQL server listening on port ' + app.get('port'))
})