const { Register, Permission } = require("../core/utils")
const axios = require("axios");
const { base } = require('../lib/_base');

Register({
  cmd: "facebook",
  aliases: ["fb"],
  category: "downloader",
  permission: Permission.ALL,
  hidden: false,

  execute: async (ctx, sock, msg) => {
    if (!ctx.q) return ctx.reply("Where Facebook url?");
    await ctx.react("⏳")
    let url;
    try {
      url = await facebook(ctx.q);
    } catch (e) {
      return ctx.reply("Failed to get media\n" + e);
      console.log(e)
    }
    if (!url) return ctx.reply("Failed to get media\n" + e);
    const bf = await sock.urlToBuffer(url)
    const cb = await sock.cek.mimetypeBuffer(bf);
    if (["jpg", "png", "jpeg"].includes(cb.ext)) {
        await sock.sendMessage(ctx.from, {
          image: { url },
          mimetype: "image/jpeg"
        }, { quoted: msg });
      } else if (["mp4"].includes(cb.ext)) {
        await sock.sendMessage(ctx.from, {
          video: { url },
          mimetype: "video/mp4"
        }, { quoted: msg });
      }
    await ctx.react("⌛")
  },
})

async function facebook(url) {
  try {
    if (!url) return
    const response = await axios.get(`${base.facebook}${url}`, { 
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36'
      }
    });
    if (!response.data.status) {
      return { status: false, message: "Gagal mengambil data" }
    }
    const data = response.data.data
    let result = data.downloads[0].url
    if (!result) {
      result = null
    }
    return result
  } catch (e) {
    console.log(e)
  }
}