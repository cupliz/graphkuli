 let config = {
  env: 'dev',
  outputDir: 'output',
  port: 5000,
  dbFile: 'mydb.sqlite',
  db: {
    client: 'mysql',
    connection: {
      host: 'localhost',
      user: 'root',
      password: 'admin',
      database: 'test'
    },
    pool: { min: 0, max: 7 }
  },
  auth: {
    login: 'admin',
    password: 'admin'
  }
}
module.exports = config