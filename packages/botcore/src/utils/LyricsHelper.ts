import Genius from 'genius-lyrics';
import { franc } from 'franc';
import { MediaWikiApi } from 'wiki-saikou';
import { iso6393 } from 'iso-639-3';
import Telegraph from 'telegra.ph';
import tph from 'telegra.ph/typings/telegraph';
import { Song } from '@clansty/maibot-types';

type Lyrics = {
	text: string,
	from: string,
	lang: string,
	link?: string,
}

const WIKI_URL = 'https://silentblue.remywiki.com';
const WIKI_NAME = 'SilentBlue Wiki';
const NETEASE_API = 'https://api-mymusic.vercel.app';

export default class LyricsHelper {
	private readonly geniusClient: Genius.Client;
	private readonly wiki: MediaWikiApi = new MediaWikiApi(WIKI_URL + '/api.php');
	private readonly telegraph: Telegraph;

	constructor(geniusSecret: string, telegraphSecret: string, private readonly deeplAuthKey: string) {
		this.geniusClient = new Genius.Client(geniusSecret);
		this.telegraph = new Telegraph(telegraphSecret);
	}

	async getLyricsTelegraf(song: Song): Promise<'None' | string> {
		const lyrics = await this.getLyrics(song.title, song.artist);
		if (lyrics === 'None') {
			return 'None';
		}
		return await this.createTelegraphPage(lyrics, song.title, song.coverUrl);
	}

	async getLyrics(name: string, artist: string): Promise<'None' | Lyrics[]> {
		let lyrics = await this.getLyricsFromWiki(name, artist);
		if (lyrics === 'None') return 'None';
		if (!lyrics?.length) {
			lyrics = await this.getLyricsFromNetease(name, artist);
		}
		if (!lyrics?.length) {
			lyrics = await this.getLyricsFromGenius(name, artist);
		}
		if (!lyrics) {
			return 'None';
		}
		// 翻译
		if (!lyrics.some(it => it.lang.toLowerCase().includes('mandarin') || it.lang.toLowerCase().includes('中文') || it.lang.toLowerCase().includes('chinese'))) {
			const neteaseLyrics = await this.getLyricsFromNetease(name, artist) || [];
			const translated = neteaseLyrics.find(it => it.lang === '中文（翻译）');
			if (translated) lyrics.push(translated);
		}
		if (!lyrics.some(it => it.lang.toLowerCase().includes('mandarin') || it.lang.toLowerCase().includes('中文') || it.lang.toLowerCase().includes('chinese'))) {
			const base = lyrics[0];
			lyrics.push({
				lang: '中文（机翻）',
				text: await this.translate(base.text),
				from: 'DeepL'
			});
		}
		return lyrics;
	}

	async getLyricsFromGenius(name: string, artist: string): Promise<Lyrics[]> {
		console.log('从 Genius 获取歌词');
		let searches = await this.geniusClient.songs.search(`${name}`);
		console.log(searches.map(it => it.title));
		searches = searches.filter(it => !it.title.toLowerCase().includes('translat')); // ion / ed
		if (!searches.length) return;
		const song = searches[0];
		const lyrics = await song.lyrics();
		if (!lyrics) return;
		const langCode = franc(lyrics);
		const lang = iso6393.find(it => it.iso6393 === langCode)?.name;
		return [{ lang, text: lyrics, from: 'Genius' }];
	}

	// 返回 undefined = NotFound，返回 None = 纯音乐没有歌词
	async getLyricsFromWiki(name: string, artist: string): Promise<Lyrics[] | undefined | 'None'> {
		console.log('从 Wiki 获取歌词');
		const search = await this.wiki.get({
			action: 'query',
			list: 'search',
			srsearch: `${name}`
		});
		const match = search.data?.query?.search?.[0];
		if (!match) {
			console.log('No match');
			return;
		}

		const page = await this.wiki.get({
			action: 'parse',
			pageid: match.pageid,
			prop: 'wikitext'
		});
		const wikiText = page.data?.parse?.wikitext;
		if (!wikiText) {
			console.log('No wikiText');
			return;
		}

		const data = this.parseLyricsFromWikitext(wikiText, WIKI_NAME);
		console.log(data);
		if (!data?.length) return;
		// 过滤掉无歌词的情况
		const noKey = data.find(it => it.lang === '');
		if (noKey && noKey.text.length < 10 && noKey.text.startsWith('None'))
			return 'None';
		if (noKey && noKey.text.length < 20 && noKey.text.includes('Need lyrics'))
			return;
		for (const lang of data) {
			lang.link = `${WIKI_URL}?curid=${match.pageid}`;
		}
		return data;
	}

	async getLyricsFromNetease(name: string, artist: string): Promise<Lyrics[] | undefined> {
		console.log('请求网易云');
		const searchUrl = new URL(NETEASE_API + '/search');
		searchUrl.searchParams.set('keywords', `${name} ${artist}`);
		const searchReq = await fetch(searchUrl);
		const search = await searchReq.json() as any;
		const song = search?.result?.songs?.[0];
		console.log(song);
		if (!song) return;

		const getLrcUrl = new URL(NETEASE_API + '/lyric');
		getLrcUrl.searchParams.set('id', song.id);
		const lrcReq = await fetch(getLrcUrl);
		const lyrics = await lrcReq.json() as any;
		console.log(lyrics);

		const res = [] as Lyrics[];
		let lrc = lyrics?.lrc?.lyric as string;
		let translate = lyrics?.tlyric?.lyric as string;
		const link = `https://music.163.com/song?id=${song.id}`;

		if (lrc) {
			lrc = lrc.replaceAll(/^\[[\d.:]*]/gm, '').trim();
			const langCode = franc(lrc);
			const lang = iso6393.find(it => it.iso6393 === langCode)?.name;
			res.push({ lang, text: lrc, from: '网易云音乐', link });
		}
		if (translate) {
			translate = translate.replaceAll(/^\[[\d.:]*]/gm, '').trim();
			res.push({ lang: '中文（翻译）', text: translate, from: '网易云音乐', link });
		}
		return res;
	}

	parseLyricsFromWikitext(text: string, from: string): Lyrics[] | undefined {
		const lines = text.split(/\n/);
		const lyrics = {} as Record<string, string>;

		let isRead = false;
		let currentLang = '';
		for (const line of lines) {
			if (line === '== Lyrics ==') {
				isRead = true;
				continue;
			}
			if (!isRead) continue;
			if (line.startsWith('=== ') && line.endsWith(' ===')) {
				currentLang = line.slice(4, -4);
				continue;
			}
			if (line.startsWith('== ')) {
				break;
			}
			if (!lyrics[currentLang] && line) {
				lyrics[currentLang] = '';
			}
			lyrics[currentLang] += line + '\n';
		}
		if (!Object.keys(lyrics).length) return;
		for (const lang of Object.keys(lyrics)) {
			lyrics[lang] = lyrics[lang].trim().replace('<pre>', '').replace('</pre>', '');
		}
		return Object.entries(lyrics).map(([lang, text]) => ({ lang, text, from }));
	}

	async translate(text: string) {
		console.log('请求翻译');
		const req = await fetch('https://deepl-proxy.netlify.app/v2/translate', {
			method: 'POST',
			headers: {
				Authorization: 'DeepL-Auth-Key ' + this.deeplAuthKey,
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			body: JSON.stringify({
				target_lang: 'ZH',
				text: [text]
			})
		});

		const res = await req.json() as any;
		return res.translations[0].text;
	}

	convertToTelegraph(lyrics: Lyrics[], cover?: string) {
		const nodes = [] as tph.Node[];
		if (cover) {
			nodes.push({
				tag: 'img',
				attrs: { src: cover }
			});
		}
		for (const lang of lyrics) {
			nodes.push({
				tag: 'h3',
				children: [lang.lang]
			});
			nodes.push({
				tag: 'blockquote',
				children: [
					'来源：',
					lang.link ?
						{ tag: 'a', attrs: { href: lang.link }, children: [lang.from] } :
						lang.from
				]
			});
			for (const line of lang.text.split('\n')) {
				nodes.push({
					tag: 'p',
					children: [line.trim() ? line.trim() : { tag: 'br' }]
				});
			}
			nodes.push({
				tag: 'p',
				children: [{ tag: 'br' }]
			});
		}
		return nodes;
	}

	async createTelegraphPage(lyrics: Lyrics[], title: string, cover?: string) {
		console.log('上传 Telegraph');
		const content = this.convertToTelegraph(lyrics, cover);
		const page = await this.telegraph.createPage(title, content, 'AquaDX Bot', 'https://t.me/AquaDXBot');
		return page.url;
	}
}
