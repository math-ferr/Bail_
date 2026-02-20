const { Register, Permission } = require("../core/utils")
const twitter = require("../lib/twitter");
const crypto = require('crypto')
const { exec } = require('child_process')
const axios = require('axios')
const path = require('path')
const fs = require("fs")

Register({
  cmd: "x",
  aliases: ["twitter"],
  category: "downloader",
  permission: Permission.ALL,
  hidden: false,

  execute: async (ctx, sock, msg) => {
    if (!ctx.q) return ctx.reply("Where X url?");
    await ctx.react("⏳")
    let res;
    try {
      res = await twitter(ctx.q);
    } catch (e) {
      return ctx.reply("Failed to get media\n" + e);
      console.log(e)
    }
    const url = res.download && res.download[0].url ? res.download[0].url : null;
    if (!url) return ctx.reply("Failed to get media\n" + e);
    const bf = await sock.urlToBuffer(url)
    const th = await getThumbnail(res.thumbnail);
    const cb = await sock.cek.mimetypeBuffer(bf);
    if (["jpg", "png", "jpeg"].includes(cb.ext)) {
        await sock.sendMessage(ctx.from, {
          image: { url },
          mimetype: "image/jpeg",
          jpegThumbnail: th
        }, { quoted: msg });
    } else if (["mp4"].includes(cb.ext)) {
        await sock.sendMessage(ctx.from, {
          video: { url },
          mimetype: "video/mp4",
          jpegThumbnail: th
        }, { quoted: msg });
    }
    await ctx.react("⌛")
  },
})

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(stderr)
      resolve(stdout)
    })
  })
}

async function getThumbnail(url) {
  const id = crypto.randomBytes(6).toString('hex')
  const input = path.join(__dirname, `${id}_input`)
  const output = path.join(__dirname, `${id}.jpg`)
  
  const res = await axios.get(url, {
    responseType: 'arraybuffer'
  })
  fs.writeFileSync(input, Buffer.from(res.data))
  let quality = 5
  let finalBuffer = null

  while (quality <= 31) {
    await run(
      `ffmpeg -y -i "${input}" -vf scale=480:-1 \
      -q:v ${quality} "${output}"`
    )
    const buffer = fs.readFileSync(output)
    if (buffer.length <= 199 * 1024) {
      finalBuffer = buffer
      break
    }
    quality += 2
  }
  fs.unlinkSync(input)
  if (fs.existsSync(output)) fs.unlinkSync(output)
  if (!finalBuffer) {
    throw new Error('Failed to compress thumbnail under 200KB')
  }
  return finalBuffer
}