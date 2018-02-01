import path from 'path'
import config from './config'

const basicAuth = function(req, res, next) {
  const authorization = req.headers.authorization
  const b64auth = (authorization || '').split(' ')[1] || ''
  const [login, password] = new Buffer(b64auth, 'base64').toString().split(':')
  if (!login || !password || login !== config.auth.login || password !== config.auth.password) {
    res.set('WWW-Authenticate', 'Basic realm="graphql"')
    res.status(401).sendFile(path.join(__dirname, '../public/401.html'))
  } else {
    next()
  }
}
export default basicAuth