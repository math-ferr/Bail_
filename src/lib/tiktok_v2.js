const axios = require('axios');
const { base } = require('./_base');

module.exports = async (url) => {
  try {
    let response;
    try {
      response = await axios.get(`${base.tiktokV1}${url}`, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36'
        }
      });
    } catch (e) {
      console.log(e)
    }
    if (!response.data.status) {
      return { status: false, message: "Gagal mengambil data" }
    }
    const data = response.data.data
    const isSlide =
      data.slides &&
      typeof data.slides === "object" &&
      Object.keys(data.slides).some(k => !isNaN(k))

    if (isSlide) {
      const slides = Object.keys(data.slides)
        .filter(key => !isNaN(key))
        .map(key => data.slides[key].url)

      return {
        status: true,
        type: "slideshow",
        item_id: data.item_id,
        author: data.author_nickname,
        caption: data.text,
        slides,
        music: data.music
      }

    } else {
      return {
        status: true,
        type: "video",
        item_id: data.itemId,
        author: data.author_nickname,
        caption: data.text,
        duration: data.duration,
        video: data.no_watermark_link,
        cover: data.cover_link,
        music: data.music_link
      }
    }
  } catch (error) {
    console.log(error)
  }
}
