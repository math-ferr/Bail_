const fs = require("fs")
const path = require("path")

const filePath = path.join(__dirname, "../data/groupSettings.json")

let groupSettings = {}
fs.watchFile(filePath, () => {
  console.log("groupSettings updated, reloading...")
  groupSettings = JSON.parse(fs.readFileSync(filePath))
})

if (fs.existsSync(filePath)) {
  groupSettings = JSON.parse(fs.readFileSync(filePath))
} else {
  fs.writeFileSync(filePath, JSON.stringify({}, null, 2))
}

function save() {
  fs.writeFileSync(filePath, JSON.stringify(groupSettings, null, 2))
}

function ensureGroup(jid) {
  if (!groupSettings[jid]) {
    groupSettings[jid] = {}
  }
  return groupSettings[jid]
}

//
// ===== MUTE FEATURE =====
//

function isMuted(jid) {
  return Boolean(groupSettings[jid]?.isMuted)
}

function mute(jid) {
  const group = ensureGroup(jid)
  group.isMuted = true
  save()
}

function unmute(jid) {
  const group = ensureGroup(jid)
  delete group.isMuted
  save()
}

//
// ===== ANTI STATUS TAG FEATURE =====
//

function isAntiTag(jid) {
  return Boolean(groupSettings[jid]?.antiStatusTag)
}

function setAntiTag(jid, value) {
  const group = ensureGroup(jid)
  group.antiStatusTag = value
  save()
}

module.exports = {
  isMuted,
  mute,
  unmute,
  isAntiTag,
  setAntiTag
}