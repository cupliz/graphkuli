import GraphQL from 'graphql'
import db from './_db'
import config from './config'
import tableMap from './structure';
var immut = {}

export function resolveQuery(schema) {
  // if (config.env == 'dev') console.log('\x1Bc');
  return (root, args, ast, info) => {
    const typeData = tableMap[schema]
    if (!typeData) {
      throw new Error('Type "' + schema + '" not a recognized type');
    }
    let query = ``
    let select = []
    let fields = info.fieldNodes[0].selectionSet.selections.map((val) => val.name.value)
    for (let val of fields) {
      let alias = getAlias(typeData.aliases, val)
      if (alias) select.push(alias + ' AS ' + typeData.aliases[alias])
    }
    query = db().select(select).from(typeData.table)
    getQueryArgs(query, args, typeData)

    if (root) {
      let parentName = info.parentType['name']
      let parent = tableMap[parentName]
      if (Object.keys(typeData.referenceMap).length <= 0 || typeData.table !== parent.table) {
        let schemaPK = keyAlias(typeData.aliases, typeData.primaryKey)
        let refKey = getAlias(parent.referenceMap, typeData.table)
        let parentFK = parent.aliases[refKey]
        query = query.where(schemaPK, root[parentFK])
      } else {
        let parentPK = parent.aliases[parent.primaryKey]
        let refKey = getAlias(typeData.referenceMap, parent.table)
        query = query.where(refKey, root[parentPK])
      }
    }

    // if (config.env == 'dev') console.log(query.toSQL().sql, query.toSQL().bindings, ' \n')
    return query.catch(handleError).then(function(result) {
      return info.returnType['ofType'] ? result : result[0]
    })

  }
}

function getQueryArgs(query, args, typeData) {
  let offset = 0,
    limit = 100
  if (args) {
    if (args.hasOwnProperty('id')) {
      query = query.where(getAlias(typeData.aliases, 'id'), args.id)
    }
    if (args.hasOwnProperty('orderBy')) {
      let orderByParams = args.orderBy.split('_')
      query = query.orderBy(orderByParams[0], orderByParams[1] || 'DESC')
    }
    if (args.hasOwnProperty('offset')) {
      offset = args['offset']
      delete args['offset']
      query = query.offset(offset)
    }
    if (args.hasOwnProperty('limit')) {
      limit = args['limit']
      delete args['limit']
    }
    query = query.limit(limit)

    if (args.hasOwnProperty('filter')) {
      argsFilter(query, args.filter)
    }
  }
}

function orArgs(query, array) {
  for (let val of array) {
    argsFilter(query, val, 'OR')
  }
}

function andArgs(query, array) {
  for (let val of array) {
    argsFilter(query, val, 'AND')
  }
}

function argsFilter(query, filter, op) {
  let argsFilter = [];
  for (let key of Object.keys(filter)) {
    if (key.charAt(0) == '_') {
      argsFilter.push(customOP(key, filter))
    } else {
      switch (key) {
        case "AND":
          andArgs(query, filter.AND)
          break
        case "OR":
          orArgs(query, filter.OR)
          break
        default:
          query.where(key, filter[key])
          break
      }
    }
  }
  if (argsFilter) {
    if (op == "OR") {
      query.where(function() {
        for (let val of argsFilter) {
          this.orWhere(val.a, val.b, val.c)
        }
      })
    } else if (op == "AND") {
      query.where(function() {
        for (let val of argsFilter) {
          this.andWhere(val.a, val.b, val.c)
        }
      })
    } else {
      query.where(function() {
        for (let val of argsFilter) {
          this.andWhere(val.a, val.b, val.c)
        }
      })
    }
  }
}

function customOP(key, array) {
  let a, b, c
  a = key.substr(1)
  if ('like' in array[key]) {
    b = 'like'
    c = `%${array[key].like}%`
  }
  if ('gt' in array[key]) {
    b = '>'
    c = array[key].gt
  }
  if ('gte' in array[key]) {
    b = '>='
    c = array[key].gte
  }
  if ('lt' in array[key]) {
    b = '<'
    c = array[key].lt
  }
  if ('lte' in array[key]) {
    b = '<='
    c = array[key].lte
  }
  if ('in' in array[key]) {
    b = 'in'
    c = array[key].in.split(',')
  }
  if ('notin' in array[key]) {
    b = 'not in'
    c = array[key].notin.split(',')
  }
  return { a, b, c }
}

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

function handleError(err) {
  throw new Error(err.sqlMessage)
}

function getAlias(aliases, field) {
  return Object.keys(aliases).find(key => aliases[key] == field)
}

function keyAlias(aliases, field) {
  return Object.keys(aliases).find(key => key == field)
}