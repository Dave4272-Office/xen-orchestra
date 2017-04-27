import createDebug from 'debug'
import DepTree from 'deptree'
import { all as pAll } from 'promise-toolbox'
import { mapValues } from 'lodash'

const debug = createDebug('xo:config-management')

export default class ConfigManagement {
  constructor () {
    this._depTree = new DepTree()
    this._managers = { __proto__: null }
  }

  addConfigManager (id, exporter, importer, dependencies) {
    const managers = this._managers
    if (id in managers) {
      throw new Error(`${id} is already taken`)
    }

    this._depTree.add(id, dependencies)
    this._managers[id] = { exporter, importer }
  }

  exportConfig () {
    return mapValues(this._managers, ({ exporter }, key) => exporter())::pAll()
  }

  async importConfig (config) {
    const managers = this._managers
    for (const key of this._depTree.resolve()) {
      const manager = managers[key]

      const data = config[key]
      if (data !== undefined) {
        debug('importing', key)
        await manager.importer(data)
      }
    }
  }
}
