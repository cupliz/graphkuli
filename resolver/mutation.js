import GraphQL from 'graphql'
import db from './db'
import config from '/src/config'
import tableMap from '/src/structure';

export function resolveMutation(schema) {
  return (root, args, ast, info) => {
    const typeData = tableMap[schema]
    if (!typeData) {
      throw new Error('Type "' + schema + '" not a recognized type')
    }
    let query = '',
      clause = {}
    if (args.input) {
      Object.keys(args.input).find(key => {
        let alias = getAlias(typeData.aliases, key)
        clause[alias] = args.input[key]
      })
    }
    let fields = info.fieldNodes[0].selectionSet.selections.map((val) => val.name.value)
    let select = []
    for (let val of fields) {
      let alias = getAlias(typeData.aliases, val)
      if (alias) select.push(alias + ' AS ' + typeData.aliases[alias])
    }
    let PK = typeData.aliases[typeData.primaryKey]
    switch (args.do) {
      case "create":
        query = db().table(typeData.table).insert(clause)
        return query.catch(handleError).then((result) => {
          let query2 = db().table(typeData.table).select(select).where(typeData.primaryKey, result[0])
          return query2.catch(handleError).then((result2) => {
            return result2.length > 1 ? result2 : result2[0]
          })
        })
        break
      case "update":
        query = db().table(typeData.table).update(clause).where(typeData.primaryKey, args[PK])
        return query.catch(handleError).then((result) => {
          let query2 = db().table(typeData.table).select(select).where(typeData.primaryKey, args.id)
          return query2.catch(handleError).then((result2) => {
            return result2[0]
          })
        })
        break
      case "delete":
        query = db().select(select).from(typeData.table).where(typeData.primaryKey, args[PK])
        return query.catch(handleError).then((result1) => {
          query = db().table(typeData.table).del().where(typeData.primaryKey, args[PK])
          return query.catch(handleError).then((result2) => {
            return result2 ? result1[0] : undefined
          })
        })
        break
      default:
        throw new Error('Action "' + args.do + '" is not implemented');
        break
    }
  }
}

module.exports = resolveMutation