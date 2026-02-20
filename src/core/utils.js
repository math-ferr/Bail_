const { 
  downloadContentFromMessage,
  generateWAMessage,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  generateMessageIDV2
} = require('@whiskeysockets/baileys');
const fs = require('fs');
const { async } = require('q');
const axios = require("axios");
const { spawn } = require("child_process");

function findFirstValueByKeyV2(key, obj) {
  if (Array.isArray(obj)) {
    for (let item of obj) {
      let found = findFirstValueByKeyV2(key, item)
      if (found) return found
    }
  } else if (typeof obj === "object" && obj !== null) {
    for (let k in obj) {
      if (k === "quotedMessage") continue

      if (k === key) {
        return obj[k]
      } else {
        let found = findFirstValueByKeyV2(key, obj[k])
        if (found) return found
      }
    }
  }
  return null
}

const getTextFromMsg = (m) => {
  if (!m.message) return ""

  const msg = m.message
  const keys = ["text", "conversation", "caption"]

  for (let key of keys) {
    let found = findFirstValueByKeyV2(key, msg)
    if (found) return found || ""
  }
  return ""
}

const Permission = {
  ALL: 0,
  ADMIN: 1,
  subOWNER:2,
  OWNER: 3,
}

const Commands = {}

/**
 * @param {{
 *  cmd: string,
 *  aliases?: string[],
 *  category?: string,
 *  permission?: number,
 *  hidden?: boolean,
 *  execute: Function
 * }} command
 */
function Register(command, pluginName = null) {
  if (!command.cmd) throw new Error("Command must have cmd")

  const cmdName = command.cmd.toLowerCase()

  const data = {
    cmd: cmdName,
    aliases: (command.aliases || []).map(a => a.toLowerCase()),
    argv: (command.argv || []).map(a => a.toLowerCase()),
    category: command.category || "general",
    permission: command.permission ?? Permission.ALL,
    hidden: command.hidden ?? false,
    execute: command.execute,
    __plugin: pluginName,
  }

  Commands[cmdName] = data
  for (const a of data.aliases) {
    Commands[a] = data
  }
}

const readmore = " ͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏"
function getUniqueCommands() {
  const seen = new Set()
  const result = []

  for (const cmd of Object.values(Commands)) {
    if (seen.has(cmd)) continue
    seen.add(cmd)
    result.push(cmd)
  }

  return result
}

async function chekMediaV2(m) {
    function findFirstValueByKeyV2(key, obj) {
        if (Array.isArray(obj)) {
            for (let item of obj) {
                let found = findFirstValueByKeyV2(key, item);
                if (found) return found;
            }
        } else if (typeof obj === 'object' && obj !== null) {
            for (let k in obj) {
                if (k === 'quotedMessage') continue; 
                if (k === key) {
                    return obj[k];
                } else {
                    let found = findFirstValueByKeyV2(key, obj[k]);
                    if (found) return found;
                }
            }
        }
        return null;
    }

    let msg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage ?? m.message;
    let messages = msg;

    if (msg.documentWithCaptionMessage) {
        msg = msg.documentWithCaptionMessage.message;
    }

    else if (msg.viewOnceMessageV2) {
        msg = msg.viewOnceMessageV2.message;
        messages = msg;
        if (msg.videoMessage) msg.videoMessage.viewOnce = false;
        else if (msg.imageMessage) msg.imageMessage.viewOnce = false;
    }

    else if (msg.viewOnceMessageV2Extension) {
        msg = msg.viewOnceMessageV2Extension.message;
        messages = msg;
        if (msg.audioMessage) msg.audioMessage.viewOnce = false;
    }

    const extKey = {
        imageMessage: "image",
        videoMessage: "video",
        stickerMessage: "sticker",
        audioMessage: "audio",
        documentMessage: "document"
    };

    let struktur = null;
    let mediaKey = null;

    for (let key in extKey) {
        let found = findFirstValueByKeyV2(key, msg);
        if (found) {
            struktur = { key, ext: extKey[key] };
            mediaKey = found;
            break;
        }
    }

    let type;
    if (struktur?.key === 'documentMessage' && msg.documentMessage?.mimetype) {
        if (msg.documentMessage.mimetype.startsWith("image")) type = "image";
        else if (msg.documentMessage.mimetype.startsWith("video")) type = "video";
        else if (msg.documentMessage.mimetype.startsWith("audio")) type = "audio";
        else type = "document";
    }

    if (!struktur) {
        return {
            isMedia: false,
            ext: undefined,
            typeM: "unknown",
            mediakey: undefined,
            isAnimation: false,
            isGif: false,
            messages
        };
    }

    return {
        isMedia: true,
        ext: struktur.ext,
        typeM: type ?? struktur.ext,
        mediakey: mediaKey,
        isAnimation: (struktur.ext === "sticker" && mediaKey?.isAnimated) ?? false,
        isGif: msg.videoMessage?.gifPlayback ?? false,
        messages
    };
}
async function getGroupAdmins(participants = []) {
  if (!Array.isArray(participants)) return []
  let admins = []
  for (let user of participants) {
    if (user.admin === "admin" || user.admin === "superadmin") {
      admins.push(user.phoneNumber)
    }
  }
  return admins
}
async function getMetadata(sock, jid) {
  try {
    return await sock.groupMetadata(jid)
  } catch {
    return null
  }
}
async function botNum(sock) {
  return await sock.decodeJid(sock.user.id)
}
class Context {
  constructor({ sock, msg, text, args, command }) {
    this.owner = "6282114234857"
    this.subOwner = ["6282114234857", "6285752044966", "6289528056337"]
    
    this.sock = sock
    this.msg = msg
    this.text = text
    this.args = args
    this.q = args.join(" ")
    this.command = command
    this.readMore = readmore

    this.from = msg.key.remoteJid
    this.sender = msg.key.participant || msg.key.remoteJid
    this.senderAlt = msg.key.participantAlt || msg.key.participant
    this.isGroup = this.from.endsWith("@g.us")

    this.groupMetadata = null
    this.participants = []
    this.botNumber = null

    this.isAdmins = false
    this.isBotAdmins = false
  }
  async init() {
    this.botNumber = await botNum(this.sock)
    if (!this.isGroup) return this
    this.groupMetadata = await getMetadata(this.sock, this.from)
    if (!this.groupMetadata) return this
    this.participants = this.groupMetadata.participants || []
    const admins = await getGroupAdmins(this.participants)
    this.admins = admins
    this.isAdmins = admins.includes(this.sender)
    this.isbotAdmins = admins.includes(await botNum(this.sock))
    this.sendAlbum = async (mediaList = [], options = {}) => {
      const sock = this.sock
      const jid = this.from
      if (!Array.isArray(mediaList) || mediaList.length === 0)
        throw new Error("mediaList must be array")
      const caption = options.caption || ""
      const quoted = options.quoted || this.msg
      const normalized = mediaList.map((m) => {
        if (Buffer.isBuffer(m)) {
          return { type: "image", data: m }
        }
        if (typeof m === "string") {
          if (m.match(/\.(mp4|mov|mkv)/i))
            return { type: "video", data: { url: m } }
          return { type: "image", data: { url: m } }
        }
        return {
          type: m.type || "image",
          data: Buffer.isBuffer(m.data) ? m.data : { url: m.url },
          caption: m.caption || ""
        }
      })
      const expectedImageCount =
        normalized.filter(v => v.type === "image").length
      const expectedVideoCount =
        normalized.filter(v => v.type === "video").length
      const albumMsg = generateWAMessageFromContent(jid, {
        albumMessage: {
          expectedImageCount,
          expectedVideoCount
        }
      }, { quoted, messageId: generateMessageIDV2(sock.user.id) })
      await sock.relayMessage(
        jid,
        albumMsg.message,
        { messageId: albumMsg.key.id }
      )
      for (let i = 0; i < normalized.length; i++) {
        const media = normalized[i]
        const payload = {
          [media.type]: media.data,
          ...(i === 0
            ? { caption: caption || media.caption }
            : {})
        }
        const msg =
          await prepareWAMessageMedia(
            payload,
            { upload: sock.waUploadToServer }
          )
        msg.messageContextInfo = {
          messageAssociation: {
            associationType: 1,
            parentMessageKey: albumMsg.key
          }
        }
        await sock.relayMessage(jid, msg, { messageId: generateMessageIDV2(sock.user.id)})
        await new Promise(r => setTimeout(r, 300))
      }
      return albumMsg
    }
    return this
  }
  isStatusTagGroup() {
    const msg = this.msg
    return (
      msg.mtype === 'groupStatusMentionMessage' ||
      (msg.quoted?.mtype === 'groupStatusMentionMessage') ||
      (msg.message?.groupStatusMentionMessage) ||
      (msg.message?.protocolMessage?.type === 25)
    )
  }
  getDevice(idz) {  
    if (/^3A.{18}$/.test(idz)) {  
      return 'ios';  
    } else if (/^3E.{20}$/.test(idz)) {  
      return 'web';  
    } else if (/^(.{21}|.{32})$/.test(idz)) {  
      return 'android';  
    } else if (/^.{18}$/.test(idz)) {  
      return 'desktop';  
    } else {  
      return 'unknown';  
    }  
  }  
  remove(path, f = null) {
    if (!f) {
      spawn("rm", [path]);
    } else {
      spawn("rm -rf", [path]);
    }
  }
  react(emoji) {
    return this.sock.sendMessage(this.from, {
      react: {
        text: emoji,
        key: this.msg.key
      }
    })
  }
  reply(input = "Nothing:/", jid = "", opts = {}) {
    const targetJid = jid || this.from;
    const text = typeof input === "string" ? input : JSON.stringify(input, null, 2)
    return this.sock.sendMessage(
        targetJid,
        { text, ...opts },
        { quoted: this.msg }
    )
  }
};

const Settings = {
  private: true, 
  group: true
}

module.exports = {
  Settings,
  getTextFromMsg,
  Permission,
  Commands,
  Register,
  Context,
  getUniqueCommands,
  chekMediaV2
}
