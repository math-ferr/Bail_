const { YtDlp } = require("ytdlp-nodejs");
const path = require("path")
const axios = require("axios")
const { spawn } = require("child_process");
const fs = require("fs");
const ytdlp = new YtDlp();

async function mp4(url, quality = "") {
    if (!url) return console.log("Insert url parameter!");
    const result = await ytdlp
      .download(url)
      .format({ filter: 'mergevideo', quality: quality, type: 'mp4' })
      .output(`./tmp/`)
      .setOutputTemplate(`${Date.now()}ytv.mp4`)
      .embedThumbnail()
      .run();
      
    if (!result.filePaths) return { error: "failed" }
    const info = result.info[0]
    const vId = await getYouTubeVideoId(url);
    const date = `${info.upload_date.substring(6, 8)}-${info.upload_date.substring(4, 6)}-${info.upload_date.substring(0, 4)}`;
    const res = {
      title: info.fulltitle || "",
      channel: info.uploader || "",
      thumbnail: `https://i.ytimg.com/vi/${vId}/hq720.jpg`,
      description: info.description || "",
      upload: date || "",
      duration: info.duration_string || "",
      video_path: info.filepath || result.filePaths[0] || "" 
    }
    return res
}
async function mp3(url, q = 5) {
  if (!url) return console.log("Insert url parameter!");
  const result = await ytdlp
      .download(url)
      .format({ filter: 'audioonly', quality: q, type: 'mp3' })
      .setOutputTemplate(`${Date.now()}yta.mp3`)
      .run();
    
    if (!result.filePaths) return { error: "failed" }
    const info = result.info[0]
    const aId = await getYouTubeVideoId(url);
    const date = `${info.upload_date.substring(6, 8)}-${info.upload_date.substring(4, 6)}-${info.upload_date.substring(0, 4)}`;
    const cover = await urlToPath(`https://i.ytimg.com/vi/${aId}/hq720.jpg`)
    await writeTags(info.filepath, info.fulltitle, info.uploader.replace("- Topic", " "), info.fulltitle, info.upload_date.substring(0, 4), "", cover);
    const res = {
      title: info.fulltitle || "",
      channel: info.uploader || "",
      thumbnail: `https://i.ytimg.com/vi/${aId}/hq720.jpg`,
      description: info.description || "",
      upload: date || "",
      duration: info.duration_string || "",
      audio_path: info.filepath || result.filePaths[0] || "" 
    }
    return res
}

function getYouTubeVideoId(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|v\/|embed\/|user\/[^\/\n\s]+\/)?(?:watch\?v=|v%3D|embed%2F|video%2F)?|youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/playlist\?list=)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}
async function urlToPath(url) {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');
      const dir = path.join(__dirname, `./tmp/cover.png`)
      fs.writeFileSync(dir, buffer);
      return dir;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
function writeTags(file_path, title, artist, album, year, lyrics, url) {
  return new Promise((resolve, reject) => {
    const pyPath = path.join(__dirname, "../lib/lib_python/write_tags.py");
    const pyProcess = spawn("python3", [pyPath, file_path, title, artist, album, year, lyrics, url]);
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

module.exports = { mp3, mp4 }