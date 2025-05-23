import genSongInfoButtons from '../utils/genSongInfoButtons';
import { Song } from '@clansty/maibot-types/src';
import LyricsHelper from '../utils/LyricsHelper';
import { BotTypes, BundledMessageBase, MessageButtonSwitchInline, MessageButtonUrl, MessageEventBase, SendMessageAction } from '@clansty/maibot-firm';
import { BuilderEnv } from '../botBuilder';
import { MESSAGE_TEMPLATE } from '../MessageTemplate';

export default <T extends BotTypes>({ bot, env, getContext, musicToFile }: BuilderEnv<T>) => {
	const genSongInfoButtonsWithCachedLyrics = async (song: Song) => {
		const origin = genSongInfoButtons(song);
		const data = await env.KV.get<string>(`lyrics:${song.id}`);
		if (data && data !== 'None') {
			origin.push([new MessageButtonUrl('查看歌词', data)]);
		}
		return { buttons: origin, lyrics: data };
	};

	bot.registerInlineQuery(/.+/, async (event) => {
		if (!event.data.trim()) {
			await event.answer()
				.withCacheTime(86400)
				.dispatch();
			return true;
		}
		const results = Song.search(event.data.trim().toLowerCase());
		console.log(results);
		const answer = event.answer()
			.withCacheTime(60);
		await Promise.all(results.map(async song => {
				if (musicToFile[song.id]) {
					answer.addAudioResult(`search:${song.dxId?.toString()}` || song.title, musicToFile[song.id])
						.setText(song.display)
						.setButtons((await genSongInfoButtonsWithCachedLyrics(song)).buttons);
				} else if (song.coverUrl) {
					answer.addPhotoResult(`search:${song.dxId?.toString()}` || song.title, song.coverUrl)
						.setTitle(song.title)
						.setText(song.display)
						.setButtons((await genSongInfoButtonsWithCachedLyrics(song)).buttons);
				} else {
					answer.addTextResult(`search:${song.dxId?.toString()}` || song.title, song.title)
						.setText(song.display)
						.setButtons((await genSongInfoButtonsWithCachedLyrics(song)).buttons);
				}
			}
		));
		await answer.dispatch();
	});

	bot.registerInlineQueryResultChosen(/^search:(\d+)$/, async (event) => {
		const song = Song.fromId(parseInt(event.match[1]));
		if (!song) return;
		const { buttons, lyrics } = await genSongInfoButtonsWithCachedLyrics(song);
		if (lyrics === 'None') return;
		if (!lyrics) {
			const helper = new LyricsHelper(env.GENIUS_SECRET, env.TELEGRAPH_SECRET, env.DEEPL_AUTH_KEY);
			const lyricsUrl = await helper.getLyricsTelegraf(song);
			await env.KV.set(`lyrics:${song.id}`, lyricsUrl);
			if (lyricsUrl !== 'None') {
				buttons.push([new MessageButtonUrl('查看歌词', lyricsUrl)]);
			}
		}
		// 由于可能那个没有歌词按钮的结果被 tg 缓存了，然后要是被触发了两次的话，就算第一次按钮的时候找到了歌词，第二次发出来还会没有歌词按钮
		// 所以这里无论如何都 edit 一次
		// 就算 error 了也没事
		await event.editMessage()
			.setButtons(buttons)
			.dispatch();
		return true;
	});

	const makeBundledMessageForSong = (bundle: BundledMessageBase<T>, song: Song) => {
		const msgTitle = song.display.substring(0, song.display.indexOf('\n'));
		const msgText = song.display.substring(song.display.indexOf('\n') + 1).trim();
		bundle.addNode().addPhoto(song.coverUrl);
		bundle.setTitle(msgTitle).setPrompt(msgTitle).setDescription(song.basicInfo.substring(song.basicInfo.indexOf('\n') + 1)).setSummary('点击查看歌曲和谱面详情');
		bundle.addNode().setText(msgText);
		for (const sheet of song.sheets) {
			bundle.addNode().setText(`${sheet.type === 'dx' ? 'DX ' : '标准'}谱面\n` + sheet.display.trim());
		}
		if (song.searchAcronyms?.length) {
			bundle.addNode().setText('此歌曲有一些别名：\n\n' + song.searchAcronyms.join('\n'));
		}
	};

	const sendSong = async (req: SendMessageAction<T>, song: Song) => {
		if (!song) return;

		const { buttons, lyrics } = await genSongInfoButtonsWithCachedLyrics(song);
		const msgTitle = song.display.substring(0, song.display.indexOf('\n'));
		const msgText = song.display.substring(song.display.indexOf('\n') + 1).trim();
		const bundle = req.addBundledMessage();
		if (musicToFile[song.id]) {
			req.addAudio(musicToFile[song.id]);
		} else if (song.coverUrl) {
			req
				.addPhoto(song.coverUrl)
				.setTemplatedMessage(MESSAGE_TEMPLATE.MusicInfo, {
					title: msgTitle,
					content: msgText,
					image: song.coverUrl
				});
		}

		makeBundledMessageForSong(bundle, song);
		const message = await req.setText(song.display).setButtons(buttons).dispatch();
		// 异步获取歌词，只在 undefined 的时候
		if (!lyrics && bot.isEditMessageSupported) {
			const helper = new LyricsHelper(env.GENIUS_SECRET, env.TELEGRAPH_SECRET, env.DEEPL_AUTH_KEY);
			const lyricsUrl = await helper.getLyricsTelegraf(song);
			await env.KV.set(`lyrics:${song.id}`, lyricsUrl);
			if (lyricsUrl !== 'None') {
				await message.edit()
					.setButtons([...buttons, [new MessageButtonUrl('查看歌词', lyricsUrl)]])
					.dispatch();
			}
		}
	};

	bot.registerCommand('start', async (event) => {
		if (!event.params[0].startsWith('song-')) return false;
		const song = Song.fromId(parseInt(event.params[0].substring(5)));
		await sendSong(event.reply(), song);
		return true;
	});

	const handleSearch = async (event: MessageEventBase<T>, kw: string) => {
		if (!kw) {
			await event.reply()
				.setText('请输入要搜索的歌曲名')
				.dispatch();
			return true;
		}
		const results = Song.search(kw.toLowerCase());
		if (!results.length) {
			await event.reply()
				.setText('找不到匹配的歌')
				.dispatch();
			return true;
		}
		if (results.length > 1) {
			const req = event.reply()
				.setText(`共找到 ${results.length} 个结果：\n\n` + results.map(song => (song.id ? song.id + '. ' : '') + song.title).join('\n'))
				.addButtons(new MessageButtonSwitchInline('选择结果', kw));

			const bundle = req.addBundledMessage();
			bundle.setTitle(`共找到 ${results.length} 个结果`).setDescription(results.map(song => (song.id ? song.id + '. ' : '') + song.title).join('\n')).setSummary('点击展开').setPrompt(`歌曲搜索：${results.length} 个结果`);
			for (const result of results) {
				bundle.addNode().addPhoto(result.coverUrl);
				makeBundledMessageForSong(bundle.addNode().addBundledMessage(), result);
			}

			await req.dispatch();
			return true;
		}

		const song = results[0];
		await sendSong(event.reply(), song);
		return true;
	};

	bot.registerCommand(['search', 'maimai', 's'], async (event) => {
		return handleSearch(event, event.params.join(' ').trim());
	});

	bot.registerKeyword([/(.+)是什么歌$/, /^[\w\/]*查歌(.+)/], async (event) => {
		return handleSearch(event, event.match[1].trim());
	});
}
