const fs = require("fs")
const path = require("path")

function loadFeatures() {
  const dir = path.join(__dirname, "../features")
  for (const file of fs.readdirSync(dir)) {
    if (file.endsWith(".js")) {
      require(path.join(dir, file))
    }
  }
}

module.exports = { loadFeatures }
