import _ from 'lodash';
import { CHU_LEVEL_EMOJI, FC, LEVEL_EMOJI, Song } from '@clansty/maibot-types/src';
import { chusanRating, computeRa } from '@clansty/maibot-utils';
import { BotTypes, MessageButtonSwitchInline } from '@clansty/maibot-firm';
import { BuilderEnv } from '../botBuilder';
import { ChuniSong } from '@clansty/maibot-types';

export default <T extends BotTypes>({ bot, env, getContext, musicToFile }: BuilderEnv<T>) => {
	bot.registerInlineQuery(/^ ?query-?chu (.+)/i, async (event) => {
		const ctx = getContext(event);
		const profile = await ctx.getCurrentProfile(false);
		if (!profile) {
			await event.answer()
				.withStartButton('请绑定用户', 'bind')
				.isPersonal()
				.dispatch();
			return true;
		}

		const query = event.match[1].trim().toLowerCase();
		if (query === '') {
			await event.answer()
				.withCacheTime(86400)
				.dispatch();
		}
		const results = ChuniSong.search(query);
		const userMusic = await profile.getChuniUserMusic(results);
		const answer = event.answer()
			.isPersonal();
		for (const song of results) {
			const userScores = userMusic.filter(it => it.musicId === song.id);
			if (!userScores.length) continue;
			_.sortBy(userScores, it => it.level);

			const message = [song.id + '. ' + song.title, ''];
			for (const userScore of userScores) {
				const chart = song.notes[userScore.level];
				message.push(`${CHU_LEVEL_EMOJI[userScore.level]} ${chart.lv.toFixed(1)} ` +
					`${userScore.scoreMax.toLocaleString('zh-CN')} = ${chusanRating(chart.lv, userScore.scoreMax)} ${userScore.isAllJustice ? 'AJ' : ''} ${userScore.isFullCombo ? 'FC' : ''}`);
			}

			// if (musicToFile[song.id]) {
			// 	// 有音频
			// 	answer.addAudioResult(song.dxId?.toString() || song.title, musicToFile[song.id])
			// 		.setText(message.join('\n'))
			// 		.addButtons(new MessageButtonSwitchInline('歌曲详情', song.id.toString()));
			// } else {
			answer.addPhotoResult(song.id?.toString() || song.title, song.coverUrl)
				.setTitle(song.title)
				.setText(message.join('\n'))
				.addButtons(new MessageButtonSwitchInline('歌曲详情', 'chu ' + song.id.toString()));
			// }
		}

		await answer.dispatch();
		return true;
	});

	bot.registerCommand(['querychu', 'qchu'], async (event) => {
		const ctx = getContext(event);
		const profile = await ctx.getCurrentProfile();
		const kw = event.params.join(' ').trim();
		if (!kw) {
			await event.reply()
				.setText('请输入关键词')
				.dispatch();
			return true;
		}

		const results = ChuniSong.search(kw);

		if (!results.length) {
			await event.reply()
				.setText('找不到匹配的歌')
				.dispatch();
			return true;
		}
		const userMusic = await profile.getChuniUserMusic(results);
		for (const song of results) {
			const userScores = userMusic.filter(it => it.musicId === song.id || it.musicId === song.id + 1e4);
			if (!userScores.length) continue;
			_.sortBy(userScores, it => it.level);

			const message = [song.id + '. ' + song.title, ''];
			for (const userScore of userScores) {
				const chart = song.notes[userScore.level];
				message.push(`${CHU_LEVEL_EMOJI[userScore.level]} ${chart.lv.toFixed(1)} ` +
					`${userScore.scoreMax.toLocaleString('zh-CN')} = ${chusanRating(chart.lv, userScore.scoreMax)} ${userScore.isAllJustice ? 'AJ' : ''} ${userScore.isFullCombo ? 'FC' : ''}`);
			}

			const reply = event.reply()
				.setText(message.join('\n'))
				.addButtons(new MessageButtonSwitchInline('歌曲详情', 'chu ' + song.id.toString()));
			// if (musicToFile[song.id]) {
			// 	reply.addAudio(musicToFile[song.id]);
			// } else {
			reply.addPhoto(song.coverUrl);
			// }
			await reply.dispatch();
			return true;
		}
		await event.reply()
			.setText(`共找到 ${results.length} 个结果：\n\n` +
				results.map(song => `${song.title} ${song.id ? '' : '(ID 缺失)'}`).join('\n') +
				// 如果有 ID 缺失就不一定没玩过了
				(results.some(it => !it.id) ? '' : '\n\n可惜你都没玩过'))
			.dispatch();
	});
}
