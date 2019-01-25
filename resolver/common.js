export function handleError(err) {
  throw new Error(err.sqlMessage)
}

export function getAlias(aliases, field) {
  return Object.keys(aliases).find(key => aliases[key] == field)
}

export function keyAlias(aliases, field) {
  return Object.keys(aliases).find(key => key == field)
}

module.exports = { handleError, getAlias, keyAlias }