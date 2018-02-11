import GraphQL from 'graphql'
import db from './db'
import config from '../src/config'
import tableMap from '../src/structure';
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
      argsFilter(query, args.filter, typeData.aliases)
    }
  }
}

function argsFilter(query, filter, aliases) {
  let argsFilter = [];
  for (let key of Object.keys(filter)) {
    if (key.charAt(0) == '_') {
      let cop_ = customOP(key, filter[key])
      query.where(getAlias(aliases,cop_.a), cop_.b, cop_.c)
    } else {
      switch (key) {
        case "AND":
          andArgs(query, filter.AND, aliases)
          break
        case "OR":
          orArgs(query, filter.OR, aliases)
          break
        default:
          query.where(getAlias(aliases,key), filter[key])
          break
      }
    }
  }
}

function andArgs(query, array, aliases) {
  let data = array[0]
  query.where(function() {
    query = this
    for (let key of Object.keys(data)) {
      if (Array.isArray(data[key])) {
        checkOP(query, key, data[key], aliases)
      } else {
        if (key.charAt(0) == '_') {
          let cop = customOP(key, data[key])
          query.andWhere(getAlias(aliases,cop.a), cop.b, cop.c)
        } else {
          query.andWhere(getAlias(aliases,key), data[key])
        }
      }
    }
  })
}

function orArgs(query, array, aliases) {
  let data = array[0]
  query.where(function() {
    query = this
    for (let key of Object.keys(data)) {
      if (Array.isArray(data[key])) {
        checkOP(query, key, data[key], aliases)
      } else {
        if (key.charAt(0) == '_') {
          let cop = customOP(key, data[key])
          query.orWhere(getAlias(aliases,cop.a), cop.b, cop.c)
        } else {
          query.orWhere(getAlias(aliases,key), data[key])
        }
      }
    }
  })
}

function checkOP(query, key, val, aliases) {
  switch (key) {
    case "AND":
      andArgs(query, val, aliases)
      break
    case "OR":
      orArgs(query, val, aliases)
      break
    default:
      andArgs(query, val, aliases)
      break
  }
}

function customOP(key, obj) {
  let a, b, c
  a = key.substr(1)
  if ('like' in obj) {
    b = 'like'
    c = `%${obj.like}%`
  }
  if ('gt' in obj) {
    b = '>'
    c = obj.gt
  }
  if ('gte' in obj) {
    b = '>='
    c = obj.gte
  }
  if ('lt' in obj) {
    b = '<'
    c = obj.lt
  }
  if ('lte' in obj) {
    b = '<='
    c = obj.lte
  }
  if ('in' in obj) {
    b = 'in'
    c = obj.in.split(',')
  }
  if ('notin' in obj) {
    b = 'not in'
    c = obj.notin.split(',')
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