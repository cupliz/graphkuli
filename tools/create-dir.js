const path = require('path')
const fse = require('fs-extra')
const config = require('../config')

function createDir() {
  let code = JSON.stringify(config, null, 2)
  let templateDir = path.resolve(__dirname,'../template')
  // fse.removeSync( path.resolve(config.outputDir,'src','type'))
  try {
    fse.copySync(templateDir, path.resolve(config.outputDir))
    createConfig(config)
  } catch (err) {
    console.error(err)
  }
}

function createConfig(config) {
  let cfg = {}
  let code = `export default `
  cfg['env'] = config['env']
  cfg['port'] = config['port']
  cfg['db'] = config['db']
  cfg['auth'] = config['auth']
  code += JSON.stringify(cfg, null, 2)
  let outputConfig = path.join(config.outputDir, 'src', 'config.js')
  fse.ensureFileSync(outputConfig)
  fse.writeFileSync(outputConfig, code);
}

module.exports = createDir