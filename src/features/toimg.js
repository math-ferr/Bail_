const webpConvert = require("../lib/webp_converter.js");
const { Register, Permission, chekMediaV2 } = require("../core/utils");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

Register({
  cmd: "toimg",
  aliases: ["tomp4"],
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
      const input = `./media/sticker/${Date.now()}.${ext}`
      fs.writeFileSync(input, buff);
      const result = await convertWebp(input);
      const bufferData = Buffer.from(result, 'base64');
      const cb = await ctx.sock.cek.mimetypeBuffer(bufferData);
      if (["jpg", "png", "jpeg"].includes(cb.ext)) {
        await ctx.sock.sendMessage(ctx.from, {
          image: bufferData,
          mimetype: "image/png"
        }, { quoted: ctx.msg });
      } else if (["mp4"].includes(cb.ext)) {
        await ctx.sock.sendMessage(ctx.from, {
          video: bufferData,
          mimetype: "video/mp4"
        }, { quoted: ctx.msg });
      }
      ctx.remove(input)
    } catch (e) {
      ctx.reply("Error: " + e);
      console.log(`ERR: ${e}`);
    }
  },
})

function convertWebp(input) {
  return new Promise((resolve, reject) => {
    const pyPath = path.join(__dirname, "../lib/lib_python/webp_convert.py");
    const pyProcess = spawn("python3", [pyPath, input]);
    let resultData = "";
    let errorData = "";
    pyProcess.stdout.on("data", (data) => {
      resultData += data.toString();
    });
    pyProcess.stderr.on("data", (data) => {
      errorData += data.toString();
    });
    pyProcess.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(errorData));
      }
      resolve(resultData.trim());
    });
  });
}