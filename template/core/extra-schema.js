module.exports = `
enum MDO {
  create
  update
  delete
}
input QOP{
  like: String
  lt: String
  lte: String
  gt: String
  gte: String
  in: String
  notin: String
}
`
