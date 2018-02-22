module.exports = `
enum METHOD {
  create
  update
  delete
}
input OPERATOR{
  like: String
  lt: String
  lte: String
  gt: String
  gte: String
  in: String
  notin: String
}
`
