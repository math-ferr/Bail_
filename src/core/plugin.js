const path = require("path")
const fs = require("fs")
const { Commands } = require("./utils")

const PLUGIN_DIR = path.join(__dirname, "../../plugins")
const LoadedPlugins = {}

function loadPlugin(name) {
  const file = path.join(PLUGIN_DIR, name + ".js")
  if (!fs.existsSync(file)) {
    throw new Error("Plugin tidak ditemukan")
  }

  delete require.cache[require.resolve(file)]
  require(file)
  LoadedPlugins[name] = file
}

function unloadPlugin(name) {
  const file = LoadedPlugins[name]
  if (!file) {
    throw new Error("Plugin belum di-load")
  }

  // hapus command dari registry
  for (const key of Object.keys(Commands)) {
    if (Commands[key]?.__plugin === name) {
      delete Commands[key]
    }
  }

  delete require.cache[require.resolve(file)]
  delete LoadedPlugins[name]
}

function reloadPlugin(name) {
  unloadPlugin(name)
  loadPlugin(name)
}

function listPlugin() {
  return Object.keys(LoadedPlugins)
}

module.exports = {
  loadPlugin,
  unloadPlugin,
  reloadPlugin,
  listPlugin,
  PLUGIN_DIR,
}
