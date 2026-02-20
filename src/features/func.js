const { Register, Permission } = require("../core/utils")

Register({
  cmd: "param",
  aliases: ["par"],
  category: "general",
  permission: Permission.OWNER,
  hidden: true,

  execute: async (ctx, sock, msg) => {
    ctx.reply(JSON.stringify(msg,0,2))
  },
})

Register({
  cmd: "get",
  aliases: ["vid"],
  category: "general",
  permission: Permission.OWNER,
  hidden: true,

  execute: async (ctx, sock, msg) => {
    if (!ctx.q) return
    const bufferData = await sock.urlToBuffer(ctx.q)
    const cb = await sock.cek.mimetypeBuffer(bufferData);
    if (["jpg", "png", "jpeg"].includes(cb.ext)) {
      await sock.sendMessage(ctx.from, {
        image: bufferData,
        mimetype: "image/png"
      }, { quoted: msg });
    } else if (["mp4"].includes(cb.ext)) {
      await sock.sendMessage(ctx.from, {
        video: bufferData,
        mimetype: "video/mp4"
      }, { quoted: msg });
    }
  },
})

Register({
  cmd: "getlinkgc",
  aliases: ["linkgc"],
  category: "group",
  permission: Permission.ADMIN,
  hidden: false,

  execute: async (ctx, sock, msg) => {
    ctx.reply("https://chat.whatsapp.com/" + await sock.groupInviteCode(ctx.from), "", )
  },
})