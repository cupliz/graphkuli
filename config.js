const con_local = {
  host: 'localhost',
  user: 'root',
  password: 'admin',
  database: 'myton_local'
}
let config = {
  env: 'dev',
  outputDir: 'output',
  port: 4000,
  dbFile: './mydb.sqlite',
  pgSchema: ['pg_catalog', 'pg_statistic', 'information_schema'],
  db: {
    client: 'mysql',
    connection: con_local,
    pool: { min: 0, max: 7 }
  },
}
module.exports = config