const { Register, Permission } = require("../core/utils")
const fs = require('fs')
const { mp3, mp4 } = require("../lib/ytdlp_node")

const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|v\/|embed\/|user\/[^\/\n\s]+\/)?(?:watch\?v=|v%3D|embed%2F|video%2F)?|youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/playlist\?list=)([a-zA-Z0-9_-]{11})/;

Register({
  cmd: "ytmp4",
  category: "downloader",
  permission: Permission.ALL,

  execute: async (ctx, sock, msg) => {
    const [url, resolusi] = ctx.q.split(/\s+/)
    const match = url ? url.match(regex) : false
    if (!ctx.q && !match) return ctx.reply("Where youtube url?\n\n> Example: .ytmp4 https://www.youtube.com/xxxxxx 720p (opsional)\nQuality:\n- 360p, 480p, 720p");
    let quality = resolusi
    if (!quality) {
      quality = '480p'
    }
    if(!['2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p', 'highest', 'lowest'].includes(quality)) return ctx.reply("Quality must be 360p, 480p, 720p");
    await ctx.react("⏳")
    let res;
    try {
      res = await mp4(url, quality);
    } catch {
      ctx.reply("Failed to get video");
    }
    const video = res.video_path;
    if (!video) return ctx.reply("Failed to get video");
    const text = `*${res.title}*\n\n- Channel: ${res.channel}\n- Dration: ${res.duration}\n- Upload: ${res.upload}\n\n> _Please wait a moment while uploading_\n${ctx.readMore}\n${res.description}\n`
    const buff = fs.readFileSync(video)
    try {
      const cap = await sock.sendMessage(ctx.from, {
        text,
        contextInfo: {
          externalAdReply: {
            title: "YouTube Download",
            thumbnailUrl: res.thumbnail,
            body: res.description.substring(0, 50),
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      })
      const op = await sock.sendMessage(ctx.from, {
        document: buff,
        mimetype: "video/mp4",
        fileName: await sanitizeFileName(res.title) + ".mp4"
      }, { quoted: cap });
      if (op) {
        ctx.remove(video)
      }
      await ctx.react("⌛")
    } catch {
      ctx.reply("Failed to send video");
    }
  },
});

Register({
  cmd: "ytmp3",
  category: "downloader",
  permission: Permission.ALL,

  execute: async (ctx, sock, msg) => {
    const [url, resolusi] = ctx.q.split(/\s+/)
    const match = url ? url.match(regex) : false
    if (!ctx.q && !match) return ctx.reply("Where youtube url?\n\n> Example: .ytmp3 https://www.youtube.com/xxxxxx");
    let quality = Number(resolusi)
    if (!quality) {
      quality = 1
    }
    if(![0,1,2,3,4,5,6,7,8,9,10].includes(quality)) return ctx.reply("Quality must be 1 - 10");
    await ctx.react("⏳")
    let res;
    try {
      res = await mp3(url, quality);
    } catch {
      ctx.reply("Failed to get audio");
    }
    
    const audio = res.audio_path;
    if (!audio) return ctx.reply("Failed to get audio");
    const text = `*${res.title}*\n\n- Channel: ${res.channel}\n- Dration: ${res.duration}\n- Upload: ${res.upload}\n\n> _Please wait a moment while uploading_\n${ctx.readMore}\n${res.description}\n`
    const buff = fs.readFileSync(audio)
    try {
      const cap = await sock.sendMessage(ctx.from, {
        text,
        contextInfo: {
          externalAdReply: {
            title: "YouTube Download",
            thumbnailUrl: res.thumbnail,
            body: res.description.substring(0, 50),
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      })
      const op = await sock.sendMessage(ctx.from, {
        document: buff,
        mimetype: "audio/mp3",
        fileName: await sanitizeFileName(res.title) + ".mp3"
      }, { quoted: cap });
      if (op) {
        ctx.remove(audio)
      }
      await ctx.react("⌛")
    } catch {
      ctx.reply("Failed to send audio");
    }
  }
});



function sanitizeFileName(text) {
  if (!text) return 'unnamed_file';
  return text
    .toString()               
    .trim()                   
    .replace(/[\\\/:*?"<>|]/g, '') 
    .replace(/\s+/g, ' ')
    .substring(0, 255);       
}

