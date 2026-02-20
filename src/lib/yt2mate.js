const axios = require('axios');


function getYouTubeVideoId(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|v\/|embed\/|user\/[^\/\n\s]+\/)?(?:watch\?v=|v%3D|embed%2F|video%2F)?|youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/playlist\?list=)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

class Ytdl {
	constructor() {
		this.baseUrl = 'https://id-y2mate.com';
	}

	async search(url) {
		try {
			const response = await axios.post(
				this.baseUrl + '/mates/analyzeV2/ajax',
				new URLSearchParams({
					'k_query': url,
					'k_page': 'home',
					'hl': '',
					'q_auto': '0'
				}), {
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
						'Accept': '*/*',
						'X-Requested-With': 'XMLHttpRequest',
						'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
						'Referer': 'https://id-y2mate.com/youtube/' + getYouTubeVideoId(url)
					}
				}
			);
			const responseData = response.data;
			return responseData;
		} catch (error) {
			if (error.response) {
				console.error(`HTTP error! status: ${error.response.status}`);
			} else {
				console.error('Axios error: ', error.message);
			}
		}
	}

	async convert(videoId, key) {
		try {
			const response = await axios.post(
				'https://id-y2mate.com/mates/convertV2/index',
				new URLSearchParams({
					'vid': videoId,
					'k': key
				}), {
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
						'Accept': '*/*',
						'X-Requested-With': 'XMLHttpRequest',
						'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
						'Referer': 'https://id-y2mate.com/youtube/' + videoId
					}
				}
			);
			const responseData = response.data;
			console.log(responseData);
			return responseData;
		} catch (error) {
			if (error.response) {
				console.error(`HTTP error! status: ${error.response.status}`);
			} else {
				console.error('Axios error: ', error.message);
			}
		}
	}

	async play(url) {
		let {
			links,
			vid,
			title
		} = await this.search(url);
		let video = {},
			audio = {};
		let thumbnail = `https://i.ytimg.com/vi/${vid}/0.jpg`

		for (let i in links.mp4) {
			let input = links.mp4[i];
			let {
				fquality,
				dlink
			} = await this.convert(vid, input.k);
			video[input.q] = {
				quality: input.q,
				formatQuality: fquality,
				formatSize: input.size,
				size: parseFloat(input.size) * (/MB$/.test(input.size) ? 1000 : 1),
				format: input.f,
				url: dlink
			};
		}

		for (let i in links.mp3) {
			let input = links.mp3[i];
			let {
				fquality,
				dlink
			} = await this.convert(vid, input.k);
			audio[input.q] = {
				quality: input.q,
				formatQuality: fquality,
				formatSize: input.size,
				size: parseFloat(input.size) * (/MB$/.test(input.size) ? 1000 : 1),
				format: input.f,
				url: dlink
			};
		}

		return {
			vid,
			title,
			thumbnail,
			video,
			audio
		};
	}

	async ymusic(url) {
		let {
			links,
			vid,
			title
		} = await this.search(url);
		let audio = {};
		let thumbnail = `https://i.ytimg.com/vi/${vid}/0.jpg`


		for (let i in links.mp3) {
			let input = links.mp3[i];
			let {
				fquality,
				dlink
			} = await this.convert(vid, input.k);
			audio[input.q] = {
				quality: input.q,
				formatQuality: fquality,
				formatSize: input.size,
				size: parseFloat(input.size) * (/MB$/.test(input.size) ? 1000 : 1),
				format: input.f,
				url: dlink
			};
		}

		return {
			vid,
			title,
			thumbnail,
			audio
		};
	}

	async yvideo(url) {
		let {
			links,
			vid,
			title
		} = await this.search(url);
		let video = {}
		let thumbnail = `https://i.ytimg.com/vi/${vid}/0.jpg`

		for (let i in links.mp4) {
			let input = links.mp4[i];
			let {
				fquality,
				dlink
			} = await this.convert(vid, input.k);
			video[input.q] = {
				quality: input.q,
				formatQuality: fquality,
				formatSize: input.size,
				size: parseFloat(input.size) * (/MB$/.test(input.size) ? 1000 : 1),
				format: input.f,
				url: dlink
			};
		}

		return {
			vid,
			title,
			thumbnail,
			video
		};
	}
}

async function y2mateplay(link) {
	const ytdl = new Ytdl();
	const result = await ytdl.play(link);
	return result
}

async function y2matemp3(link) {
	const ytdl = new Ytdl();
	const result = await ytdl.ymusic(link);
	return result
}

async function y2matemp4(link) {
	const ytdl = new Ytdl();
	const result = await ytdl.yvideo(link);
	return result
}
module.exports = {
	y2mateplay,
	y2matemp3,
	y2matemp4
}