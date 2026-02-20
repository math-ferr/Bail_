const { getTextFromMsg, Commands, Permission, Context, Settings } = require("../core/utils")
const { isMuted, isAntiTag } = require("../core/group")
const path = require("path");

module.exports = async (sock, msg) => {
  if (!msg.message) return
  //console.log(JSON.stringify(msg, null, 2))
  const ms = msg
  const text = getTextFromMsg(msg)
  
  const [cmdName, ...args] = text.slice(1).trim().split(/\s+/)
  const command = Commands[cmdName.toLowerCase()]
  const arg = text? text.trim().split(/ +/) : [];
    q = arg.slice(1).join(" ");
  const ctx = await new Context({
    sock,
    msg,
    text,
    args,
    command
  }).init()
  if (ctx.isGroup && isAntiTag(ctx.from)) {
    if (ctx.isStatusTagGroup(msg)) {
      console.log("status groups")
      if (ctx.admins.includes(ctx.senderAlt)) return ctx.reply("ck... Admin")
      let text = ""
      if (ctx.admins.includes(ctx.botNumber)) {
        await sock.sendMessage(ctx.from, { delete: msg.key })
        text = `@${ctx.sender.split("@")[0]} dilarang tag group lewat status!`
      } else {
        text =
          `_Bot bukan admin, tidak bisa menghapus_\n` +
          `@${ctx.sender.split("@")[0]} dilarang tag group lewat status!`
      }
      await sock.sendMessage(ctx.from, {
        text,
        mentions: [ctx.sender]
      })
    }
  }
  if (!text || !text.startsWith(".")) return
  if (!command) return
  if (msg.key.remoteJid.endsWith("@g.us") && isMuted(msg.key.remoteJid) && command.cmd !== "unmute" && command.permission !== Permission.ADMIN) {
    return
  }
  if (ctx.isGroup) {
    console.log(`Group: ${ctx.groupMetadata.subject || ""}`)
  }
  console.log(`From: ${msg.pushName || ""}`)
  console.log(`Cmd: .${cmdName}`)
  if (ctx.q) {
   console.log(`Args: ${ctx.q}`) 
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    
  
  if (command.permission === Permission.ADMIN) {
    if (!ctx.isGroup) return ctx.reply("Group feature...")
    const admin = await ctx.admins;
    const sender = msg.key.participantAlt || msg.key.remoteJidAlt
    if (!admin.includes(sender)) {
      return ctx.reply("Admin Only!")
    }
  } else if (command.permission === Permission.subOWNER) {
    const subOwner = ctx.subOwner.map(n => n + "@s.whatsapp.net")
    const sender = msg.key.participantAlt || msg.key.remoteJidAlt
    if (!subOwner.includes(sender)) {
      return ctx.reply("Owner Only!")
    }
  } else if (command.permission === Permission.OWNER) {
    const owner = ctx.owner + "@s.whatsapp.net"
    const sender = msg.key.participantAlt || msg.key.remoteJidAlt
    if (sender !== owner) {
      return ctx.reply("Owner Only!")
    }
  } 
  
  if (!ctx.isGroup && !Settings.private) {
    return
  } else if (ctx.isGroup && !Settings.group) {
    return
  }
  await command.execute(ctx, sock, msg)
}