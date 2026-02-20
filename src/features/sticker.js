const { Register, Permission, chekMediaV2 } = require("../core/utils")
const fs = require("fs");

Register({
  cmd: "sticker",
  aliases: ["s", "stiker"],
  category: "media",
  permission: Permission.ALL,
  hidden: false,

  execute: async (ctx) => {
    try {
      let buff;
      try {
        buff = await ctx.sock.download(ctx.msg);
      } catch (e) {  
        return await ctx.reply(`Reply media dengan .${ctx.command.cmd}`);
        console.log(e)
      }
      if (!buff) return ctx.reply(`Reply media dengan .${ctx.command.cmd}`);
      const { ext } = await ctx.sock.cek.mimetypeBuffer(buff);
      const inPath = `./media/sticker/${Date.now()}.${ext}`
      fs.writeFileSync(inPath, buff);
      const sticker = await ctx.sock.createSticker(inPath);
      const pack = 'Yuna';
      const author = ctx.msg.pushName;
      const emoji = '🤖'
      const r = await ctx.sock.addExif(sticker, pack, author, emoji);
      await ctx.sock.sendMessage(ctx.msg.key.remoteJid, {
        sticker: { url: r }
      }, { quoted: ctx.msg });
      ctx.remove(inPath)
      ctx.remove(sticker)
      ctx.remove(r)
    } catch (e) {
      ctx.reply("Error: " + e);
      console.log(`ERR: ${e}`);
    }
  },
})
