const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const axios = require('axios')
const { exec } = require('child_process')

const TMP = path.join(__dirname, 'tmp')
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP)

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(stderr)
      resolve(stdout)
    })
  })
}

async function webpConvert(input, { fps = 15 } = {}) {
  const id = crypto.randomBytes(6).toString('hex')

  let buffer

  // Handle input
  if (Buffer.isBuffer(input)) {
    buffer = input
  } else if (typeof input === 'string') {
    if (input.startsWith('http')) {
      const res = await axios.get(input, { responseType: 'arraybuffer' })
      buffer = Buffer.from(res.data)
    } else {
      buffer = fs.readFileSync(input)
    }
  } else {
    throw new Error('Unsupported input')
  }

  const inputPath = path.join(TMP, `${id}.webp`)
  fs.writeFileSync(inputPath, buffer)

  const info = await run(`webpmux -info "${inputPath}"`)
  const isAnimated = info.includes('Animation')

  let outputPath

  // =======================
  // 🎬 Animated
  // =======================
  if (isAnimated) {

    const framesDir = path.join(TMP, `${id}_frames`)
    fs.mkdirSync(framesDir)

    const match = info.match(/Number of frames: (\d+)/)
    const totalFrames = match ? parseInt(match[1]) : 0

    for (let i = 1; i <= totalFrames; i++) {
      const frameWebp = path.join(framesDir, `${String(i).padStart(4, '0')}.webp`)
      const framePng = frameWebp + '.png'

      // Extract frame (still webp)
      await run(`webpmux -get frame ${i} "${inputPath}" -o "${frameWebp}"`)

      // Convert static webp → png pakai ffmpeg
      await run(`ffmpeg -y -i "${frameWebp}" "${framePng}"`)

      fs.unlinkSync(frameWebp)
    }

    outputPath = path.join(TMP, `${id}.mp4`)

    await run(`ffmpeg -y -framerate ${fps} -i "${framesDir}/%04d.webp.png" \
    -pix_fmt yuv420p -movflags faststart "${outputPath}"`)

    fs.rmSync(framesDir, { recursive: true, force: true })
  }

  // =======================
  // 🖼 Static
  // =======================
  else {
    outputPath = path.join(TMP, `${id}.png`)
    await run(`ffmpeg -y -i "${inputPath}" "${outputPath}"`)
  }

  const result = fs.readFileSync(outputPath)

  // cleanup
  fs.readdirSync(TMP).forEach(f => {
    if (f.startsWith(id)) {
      fs.rmSync(path.join(TMP, f), { recursive: true, force: true })
    }
  })

  return result
}

module.exports = webpConvert