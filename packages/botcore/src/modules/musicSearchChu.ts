import { ChuniSong as Song } from '@clansty/maibot-types';
import { BotTypes, BundledMessageBase, MessageButtonSwitchInline, MessageButtonUrl, MessageEventBase, SendMessageAction } from '@clansty/maibot-firm';
import { BuilderEnv } from '../botBuilder';
import { MESSAGE_TEMPLATE } from '../MessageTemplate';

export default <T extends BotTypes>({ bot, env, getContext, musicToFile }: BuilderEnv<T>) => {
	bot.registerInlineQuery(/chu (.+)/, async (event) => {
		if (!event.match[1].trim()) {
			await event.answer()
				.withCacheTime(86400)
				.dispatch();
			return true;
		}
		const results = Song.search(event.match[1].trim().toLowerCase());
		console.log(results);
		const answer = event.answer()
			.withCacheTime(60);
		await Promise.all(results.map(async song => {
				// if (musicToFile[song.id]) {
				// 	answer.addAudioResult(`chu:${song.id}` || song.title, musicToFile[song.id])
				// 		.setText(song.display);
				// } else 
				if (song.coverUrl) {
					answer.addPhotoResult(`chu:${song.id}` || song.title, song.coverUrl)
						.setTitle(song.title)
						.setText(song.display);
				} else {
					answer.addTextResult(`chu:${song.id}` || song.title, song.title)
						.setText(song.display);
				}
			}
		));
		await answer.dispatch();
	});

	const sendSong = async (req: SendMessageAction<T>, song: Song) => {
		if (!song) return;

		const msgTitle = song.display.substring(0, song.display.indexOf('\n'));
		const msgText = song.display.substring(song.display.indexOf('\n') + 1).trim();
		// if (musicToFile[song.id]) {
		// 	req.addAudio(musicToFile[song.id]);
		// } else if (song.coverUrl) {
		req
			.addPhoto(song.coverUrl)
			.setTemplatedMessage(MESSAGE_TEMPLATE.MusicInfo, {
				title: msgTitle,
				content: msgText,
				image: song.coverUrl
			});
		// }

		await req.setText(song.display).dispatch();
	};

	bot.registerCommand('start', async (event) => {
		if (!event.params[0].startsWith('chu-')) return false;
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
				.addButtons(new MessageButtonSwitchInline('选择结果', `chu ${kw}`));

			const bundle = req.addBundledMessage();
			bundle.setTitle(`共找到 ${results.length} 个结果`).setDescription(results.map(song => (song.id ? song.id + '. ' : '') + song.title).join('\n')).setSummary('点击展开').setPrompt(`歌曲搜索：${results.length} 个结果`);
			for (const result of results) {
				bundle.addNode().addPhoto(result.coverUrl);
				bundle.addNode().setText(result.display);
			}

			await req.dispatch();
			return true;
		}

		const song = results[0];
		await sendSong(event.reply(), song);
		return true;
	};

	bot.registerCommand(['chu', 'chuni'], async (event) => {
		return handleSearch(event, event.params.join(' ').trim());
	});
}
