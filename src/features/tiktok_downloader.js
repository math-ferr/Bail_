const { Register, Permission } = require("../core/utils")
const tiktok = require("../lib/tiktok_v2")

Register({
  cmd: "tiktok",
  aliases: ["tt"],
  category: "downloader",
  permission: Permission.ALL,
  hidden: false,

  execute: async (ctx, sock, msg) => {
    if (!ctx.q) return ctx.reply("Where tiktok url?");
    await ctx.react("⏳")
    let res;
    try {
      res = await tiktok(ctx.q);
    } catch (e) {
      return ctx.reply("Failed to get media\n" + e);
      console.log(e)
    }
    if (!res.status) return ctx.reply("Failed to get media\n");
    const text = `${res.caption || ""}\n\n${res.author || ""}`;
    if (!res.slides) {
      const url = res.video;
      if (!url) return ctx.reply("Failed to get media\n" + e);
      const r = await sock.sendMessage(ctx.from, {
          video: { url },
          mimetype: "video/mp4",
          caption: text
        }, { quoted: msg });
      if (!res.music) return
      sock.sendMessage(ctx.from, {
        audio: { url: res.music },
        mimetype: "audio/mp4"
      }, { quoted: r })
    } else {
      const options = {
        caption: text
      }
      await ctx.sendAlbum(res.slides, options);
    }
    await ctx.react("⌛")
  },
})