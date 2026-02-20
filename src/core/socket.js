const readline = require('readline');
const { downloadContentFromMessage, jidDecode } = require('@whiskeysockets/baileys');
const fs_2 = require("fs/promises");
const fs = require("fs");
const FormData = require('form-data')
const ffmpeg = require("fluent-ffmpeg");
const webp = require("node-webpmux");
const path = require("path");
const { v4: uuidv4 } = require('uuid');
const axios = require("axios");
const { chekMediaV2 } = require("./utils.js");

async function bindSocketHelper(sock) {
  sock.useCode = async (s) =>{
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('Insert your Number: +', async (phoneNumber) => {
      try {
        const code = await sock.requestPairingCode(phoneNumber);
        const formattedCode = code?.match(/.{1,4}/g).join('-') || code;
        console.log('Pairing code:', formattedCode);
        rl.close();
      } catch (err) {
        console.log(err);
        rl.close();
      }
    });
  }
  sock.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }
  sock.deleteFolder = async (folderPath) => {
    if (fs.existsSync(folderPath)) {
      fs.readdirSync(folderPath).forEach(function (file, index) {
        const curPath = folderPath + '/' + file;
          if (fs.lstatSync(curPath).isDirectory()) {
            sock.deleteFolder(curPath);
          } else { 
            fs.unlinkSync(curPath);
          }
      });
      fs.rmdirSync(folderPath);
      console.log(`Folder ${folderPath} berhasil dihapus.`);
    } else {
      console.log(`Folder ${folderPath} tidak ditemukan.`);
    }
  }
  const akyo = "whtzW9GARbh8ngdmRV60W6Y0xM6d5XG3";
  sock.json = {
    read: async (filePath) => {
      try {
        const data = await fs_2.readFile(filePath, "utf8");
        return JSON.parse(data);
      } catch (e) {
        console.log(e);
        return e;
      }
    },
    write: async (filePath, data) => {
      try {
        await fs_2.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
      } catch (e) {
        console.log(e);
      }
    }            
  }
  sock.download = async (msg) => {
    try {
      const res = await chekMediaV2(msg);
      const stream = await downloadContentFromMessage(res.mediakey, res.ext);
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buff = Buffer.concat(chunks);
      return buff;
    } catch (e) {
      return 
    }
  }
  sock.pathToBuffer = async (path) => {
    try {
      const buffer = await fs_2.readFile(path);
      return buffer;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  sock.urlToPath = async (url) => {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');
      const cb = await sock.cek.mimetypeBuffer(buffer);
      const dir = path.join(__dirname, `../media/tmp/${Date.now()}.${cb.ext}`)
      fs.writeFileSync(dir, buffer);
      return dir;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  sock.urlToBuffer = async (url) => {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');
      return buffer;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  sock.urlToBase64 = async (url) => {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');
      const base64 = buffer.toString('base64');
      return base64;
    } catch (error) {
      console.log("Error fetching the image:", error);
      return null;
    }
  };
  sock.createSticker = async (pathImg) => {
    let type;
    if (pathImg.endsWith(".mp4")) {
      type = [
        "-vcodec", "libwebp",
        "-vf", "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
        "-loop", "0",
        "-ss", "00:00:00",
        "-t", "00:00:05",
        "-preset", "default",
        "-an", "-vsync", "0"
      ];
    } else if (pathImg.endsWith(".gif")) {
      type = [
        "-c:v", "libwebp",
        "-q:v", "75",
        "-loop", "0",
        "-preset", "default"
      ];
    } else if (['.png', '.jpg', '.jpeg'].some(ext => pathImg.endsWith(ext))) {
      type = [
        "-vcodec", "libwebp",
        "-vf", "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse"
      ];
    } else {
      type = [
        "-vcodec",
        "libwebp",
        "-vf",
        "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse"
      ]
    }
    return new Promise((resolve, reject) => {
      const outputDir = path.resolve(__dirname, '../../media/sticker');
      const outputFile = path.join(outputDir, `${Date.now()}s.webp`);
                
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      ffmpeg(pathImg)
      .on("error", (err) => reject(err))
      .on("end", async () => {
        try {
          resolve(outputFile);
        } catch (exifError) {
          reject(exifError);
        }
      })
      .addOutputOptions(type)
      .format("webp")
      .output(outputFile)
      .run();
    });
  }
  sock.upload = async (media, aky = false, fileName = '') => {
    const { fileTypeFromBuffer } = await import('file-type');
    if (!media || media.length === 0) {
      throw new Error('media is empty')
    }
    if (!fileName) {
      const type = await fileTypeFromBuffer(media)
      fileName = `file_${Date.now()}.${type?.ext || 'bin'}`
    }
    const form = new FormData()
    form.append('file', media, fileName)
    let head = form.getHeaders()
    if (aky) {
      form.append('token', akyo)
      form.append('folderId', "db24cf64-2086-4588-a6c1-60d38957ade3")
    }
    try {
      const uploadResp = await axios.post(
        `https://upload.gofile.io/uploadfile`,
        form,
        {
          headers: head,
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      )
      const fileID = uploadResp.data?.data?.id
      const downloadFileName = uploadResp.data?.data?.name
      if (!fileID) {
        throw new Error('empty file id from gofile')
      }
      if (!downloadFileName) {
        throw new Error('empty file name from gofile')
      }
      return `https://upload.gofile.io/download/${fileID}/${downloadFileName}`
    } catch (err) {
     console.log('STATUS:', err.response?.status)
      console.log('DATA:', err.response?.data)
      console.log('MESSAGE:', err.message)
    }
  }
  sock.addExif = async (media, pack, author, emoji) => {
    try {
      const outputDir = path.resolve(__dirname, '../../media/sticker');
      const outputFile = path.join(outputDir, `${Date.now()}exif_edit.webp`);
      const uniqueId = await uuidv4();
      const img = new webp.Image()
      const json = {
        "android-app-store-link": 'https://play.google.com/store/apps/details?id=com.HoYoverse.hkrpgoversea',
        "ios-app-store-link": 'https://apps.apple.com/us/app/honkai-star-rail/id1599719154',
        "sticker-pack-name": pack,
        "sticker-pack-publisher": author,
        "emojis": emoji || [""]
      }
      const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
      const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8")
      const exif = Buffer.concat([exifAttr, jsonBuff])
      exif.writeUIntLE(jsonBuff.length, 14, 4)
      await img.load(media)
      img.exif = exif
      await img.save(outputFile);
      return outputFile;
    } catch (e) {
      console.log(e);
    }
  }
  sock.grp = async (folderPath) => {
    const _fs = require('fs').promises;
    try {
      const files = await _fs.readdir(folderPath);
      const images = files.filter(file => 
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
      );
      if (images.length === 0) {
        throw new Error('Tidak ada file di folder');
      }
      const randomFile = images[Math.floor(Math.random() * images.length)];
      return path.join(folderPath, randomFile);
    } catch (err) {
      console.error(err);
      return null;
    }
  }
  sock.cek = {
    mimetypeBuffer: async (buffer) => {
      const { fileTypeFromBuffer } = await import("file-type");
      try {
        const fileType = await fileTypeFromBuffer(buffer);
        return fileType;
      } catch (e) {
        console.log(e);
      }
    },
    mimetypeUrl: async (url) => {
      const { fileTypeFromBuffer } = await import("file-type");
      const stream = require('stream');
      const PassThrough = new stream.PassThrough();

      try {
        const response = await axios({
          method: 'get',
          url: url,
          responseType: 'stream',
        });
        const stream = response.data.pipe(PassThrough());
        const chunks = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        const fileType = await fileTypeFromBuffer(buffer);
          return fileType;
      } catch (e) {
        console.log(e);
      }
    }
  }
}

module.exports = { bindSocketHelper }
