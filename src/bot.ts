import { Telegraf } from 'telegraf';
import BotContext from './models/BotContext';
import { BA_VE, FC, INLINE_HELP, LEVEL_EMOJI, LEVELS, PLATE_TYPE, PLATE_VER } from './consts';
import compute from './compute';
import Song from './models/Song';
import Renderer from './render';
import { Env } from '../worker-configuration';
import { useNewReplies } from 'telegraf/future';
import { InlineQueryResult } from 'telegraf/types';
import genSongInfoButtons from './utils/genSongInfoButtons';
import _ from 'lodash';

export const createBot = (env: Env) => {
	const bot = new Telegraf(env.BOT_TOKEN, { contextType: BotContext });
	bot.context.env = env;
	bot.use(useNewReplies());

	bot.start(Telegraf.reply('Hello'));
	bot.command('bind', async (ctx) => {
		if (ctx.args.length < 1) {
			await ctx.reply('请输入要绑定的 ID');
			return;
		}

		await env.KV.put(`bind:${ctx.from.id}`, ctx.args[0]);
		await ctx.reply(`绑定 ID ${ctx.args[0]} 成功`);
	});

	bot.command(['search', 'maimai'], async (ctx) => {
		const results = Song.search(ctx.payload.trim().toLowerCase());
		if (!results.length) {
			await ctx.reply('找不到匹配的歌');
			return;
		}
		if (results.length > 1) {
			await ctx.reply(`共找到 ${results.length} 个结果：\n\n` + results.map(song => (song.id ? song.id + '. ' : '') + song.title).join('\n'), {
				reply_markup: {
					inline_keyboard: [[
						{ text: '选择结果', switch_inline_query_current_chat: ctx.payload.trim() }
					]]
				}
			});
			return;
		}

		const song = results[0];
		const extra = {
			caption: song.display,
			reply_markup: { inline_keyboard: genSongInfoButtons(song) }
		};
		if (song.tgMusicId) {
			await ctx.replyWithAudio(song.tgMusicId, extra);
		} else {
			await ctx.replyWithPhoto(song.coverUrl, extra);
		}
	});

	bot.action(/^song:(\d+):(\d)$/, async (ctx) => {
		const song = Song.fromId(Number(ctx.match[1]));
		if (!song) return;

		const chart = song.getChart(Number(ctx.match[2]));
		if (!chart) return;

		if (chart.display.length <= 200) {
			await ctx.answerCbQuery(chart.display, { show_alert: true, cache_time: 3600 });
			return;
		}
		await ctx.answerCbQuery();

		const buttons = genSongInfoButtons(song);
		buttons.push([{ text: '🔙 返回', callback_data: `song:${song.dxId}` }]);
		await ctx.editMessageCaption(song.basicInfo + '\n\n' + chart.display, {
			reply_markup: { inline_keyboard: buttons }
		});
	});

	bot.action(/^song:(\d+)$/, async (ctx) => {
		const song = Song.fromId(Number(ctx.match[1]));
		if (!song) return;

		await ctx.editMessageCaption(song.display, {
			reply_markup: { inline_keyboard: genSongInfoButtons(song) }
		});
	});

	bot.action(/^song:(\d+):alias$/, async (ctx) => {
		const song = Song.fromId(Number(ctx.match[1]));
		if (!song) return;

		const message = '歌曲别名:\n' + song.searchAcronyms.join(', ');
		if (message.length <= 200) {
			await ctx.answerCbQuery(message, { show_alert: true, cache_time: 3600 });
			return;
		}

		const buttons = genSongInfoButtons(song);
		buttons.push([{ text: '🔙 返回', callback_data: `song:${song.dxId}` }]);
		await ctx.editMessageCaption(song.basicInfo + '\n\n' + message, {
			reply_markup: { inline_keyboard: buttons }
		});
	});

	bot.inlineQuery(/^$/, async (ctx) => {
		// @ts-ignore ???
		await ctx.answerInlineQuery(INLINE_HELP.map((text, seq) => ({
			type: 'article',
			id: seq,
			title: text,
			input_message_content: { message_text: '喵' }
		})));
	});

	bot.inlineQuery(/^ ?query (.+)/, async (ctx) => {
		const userMusic = await ctx.getUserMusic(false);
		if (!userMusic?.length) {
			await ctx.answerInlineQuery([], {
				button: { text: '请绑定用户', start_parameter: 'bind' },
				is_personal: true
			});
			return;
		}

		const query = ctx.match[1].trim().toLowerCase();
		if (query === '') {
			await ctx.answerInlineQuery([]);
		}
		const results = Song.search(query);
		const ret = [] as InlineQueryResult[];
		for (const song of results) {
			const userScores = (await ctx.getUserMusic()).filter(it => it.musicId === song.id || it.musicId === song.id + 1e4);
			if (!userScores.length) continue;
			_.sortBy(userScores, it => it.level);

			const message = [song.id + '. ' + song.title, ''];
			for (const userScore of userScores) {
				const chart = song.getChart(userScore.level, userScore.musicId > 1e4);
				message.push(`${userScore.musicId > 1e4 ? 'DX' : 'STD'} ${LEVEL_EMOJI[userScore.level]} ${chart.internalLevelValue.toFixed(1)} ` +
					`${(userScore.achievement / 1e4).toFixed(4)}% ${FC[userScore.comboStatus]}`);
			}

			ret.push(song.tgMusicId ?
				{
					type: 'audio',
					audio_file_id: song.tgMusicId,
					id: song.dxId?.toString() || song.title,
					caption: message.join('\n'),
					reply_markup: {
						inline_keyboard: [[
							{ text: '歌曲详情', switch_inline_query_current_chat: song.id.toString() }
						]]
					}
				} :
				{
					type: 'photo',
					title: song.title,
					description: song.title,
					id: song.dxId?.toString() || song.title,
					photo_url: song.coverUrl,
					thumbnail_url: song.coverUrl,
					caption: message.join('\n'),
					reply_markup: {
						inline_keyboard: [[
							{ text: '歌曲详情', switch_inline_query_current_chat: song.id.toString() }
						]]
					}
				});
		}

		await ctx.answerInlineQuery(ret, {
			is_personal: true
		});
	});

	for (const version of PLATE_VER) {
		for (const type of PLATE_TYPE) {
			bot.inlineQuery(RegExp(`^ ?\\/?${version} ?${type} ?(进度)?$`), async (ctx) => {
				const userMusic = await ctx.getUserMusic();
				if (!userMusic?.length) {
					await ctx.answerInlineQuery([], {
						button: { text: '请绑定用户', start_parameter: 'bind' },
						is_personal: true
					});
					return;
				}

				const text = compute.calcProgressText(userMusic, version, type);
				await ctx.answerInlineQuery([{
					type: 'article',
					id: '0',
					title: `${version}${type}进度`,
					description: '牌子进度 ' + text.split('\n').pop(),
					input_message_content: { message_text: `${version}${type}进度\n\n` + text }
				}], { is_personal: true });
			});
			bot.hears(RegExp(`^\\/?${version} ?${type} ?进度$`), async (ctx) => {
				await ctx.reply(compute.calcProgressText(await ctx.getUserMusic(), version, type));
			});
			bot.hears(RegExp(`^\\/?${version} ?${type} ?完成[图表]$`), async (ctx) => {
				const genMsg = ctx.reply('图片生成中...');
				await ctx.replyWithDocument({ source: await new Renderer(env.MYBROWSER).renderPlateProgress(await ctx.getUserMusic(), version, type), filename: `${version}${type}完成表.png` });
				await ctx.deleteMessage((await genMsg).message_id);
			});
		}
	}
	bot.inlineQuery(RegExp(`^ ?\\/?霸者 ?(进度)?$`), async (ctx) => {
		const userMusic = await ctx.getUserMusic();
		if (!userMusic?.length) {
			await ctx.answerInlineQuery([], {
				button: { text: '请绑定用户', start_parameter: 'bind' },
				is_personal: true
			});
			return;
		}

		const text = compute.calcProgressText(userMusic, BA_VE);
		await ctx.answerInlineQuery([{
			type: 'article',
			id: '0',
			title: `霸者进度`,
			description: '牌子进度 ' + text.split('\n').pop(),
			input_message_content: { message_text: `霸者进度\n\n` + text }
		}], { is_personal: true });
	});
	bot.hears(['/', ''].map(it => it + '霸者进度'), async (ctx) => {
		await ctx.reply(compute.calcProgressText(await ctx.getUserMusic(), BA_VE));
	});
	bot.hears(/^\/?霸者完成[图表]$/, async (ctx) => {
		const genMsg = ctx.reply('图片生成中...');
		await ctx.replyWithDocument({ source: await new Renderer(env.MYBROWSER).renderPlateProgress(await ctx.getUserMusic(), BA_VE), filename: '霸者完成表.png' });
		await ctx.deleteMessage((await genMsg).message_id);
	});

	bot.inlineQuery(/.+/, async (ctx) => {
		if (ctx.inlineQuery.query.trim() === '') {
			await ctx.answerInlineQuery([]);
		}
		const results = Song.search(ctx.inlineQuery.query.trim().toLowerCase());
		await ctx.answerInlineQuery(results.map(song =>
			song.tgMusicId ?
				{
					type: 'audio',
					audio_file_id: song.tgMusicId,
					id: song.dxId?.toString() || song.title,
					caption: song.display,
					reply_markup: { inline_keyboard: genSongInfoButtons(song) }
				} :
				{
					type: 'photo',
					title: song.title,
					description: song.title,
					id: song.dxId?.toString() || song.title,
					photo_url: song.coverUrl,
					thumbnail_url: song.coverUrl,
					caption: song.display,
					reply_markup: { inline_keyboard: genSongInfoButtons(song) }
				}), { cache_time: 3600 });
	});

	for (const level of LEVELS) {
		bot.hears(RegExp(`^\\/?${level.replace('+', '\\+')} ?完成[图表]$`), async (ctx) => {
			const genMsg = ctx.reply('图片生成中...');
			await ctx.replyWithDocument({ source: await new Renderer(env.MYBROWSER).renderLevelProgress(await ctx.getUserMusic(), level), filename: `LV ${level} 完成表.png` });
			await ctx.deleteMessage((await genMsg).message_id);
		});
	}

	bot.command('b50', async (ctx) => {
		const genMsg = ctx.reply('图片生成中...');

		const userMusic = await ctx.getUserMusic();
		const rating = await ctx.getUserRating();
		const userPreview = await ctx.getUserPreview();

		let avatar = await ctx.telegram.getUserProfilePhotos(ctx.from.id, 0, 1).then(it => it.photos[0]?.[0].file_id);
		if (avatar) {
			avatar = (await ctx.telegram.getFileLink(avatar)).toString();
		} else {
			avatar = 'https://nyac.at/api/telegram/avatar/' + ctx.from.id;
			const res = await fetch(avatar, { method: 'HEAD' });
			if (!res.ok) avatar = '';
		}

		await ctx.replyWithDocument({ source: await new Renderer(env.MYBROWSER).renderB50(rating, userMusic, userPreview.userName, avatar), filename: 'B50.png' });
		await ctx.deleteMessage((await genMsg).message_id);
	});

	bot.command('query', async (ctx) => {
		const results = Song.search(ctx.payload.trim().toLowerCase());

		if (!results.length) {
			await ctx.reply('找不到匹配的歌');
			return;
		}
		for (const song of results) {
			const userScores = (await ctx.getUserMusic()).filter(it => it.musicId === song.id || it.musicId === song.id + 1e4);
			if (!userScores.length) continue;
			_.sortBy(userScores, it => it.level);

			const message = [song.id + '. ' + song.title, ''];
			for (const userScore of userScores) {
				const chart = song.getChart(userScore.level, userScore.musicId > 1e4);
				message.push(`${userScore.musicId > 1e4 ? 'DX' : 'STD'} ${LEVEL_EMOJI[userScore.level]} ${chart.internalLevelValue.toFixed(1)} ` +
					`${(userScore.achievement / 1e4).toFixed(4)}% ${FC[userScore.comboStatus]}`);
			}

			const extra = {
				caption: message.join('\n'),
				reply_markup: {
					inline_keyboard: [[
						{ text: '歌曲详情', switch_inline_query_current_chat: song.id.toString() }
					]]
				}
			};
			if (song.tgMusicId) {
				await ctx.replyWithAudio(song.tgMusicId, extra);
			} else {
				await ctx.replyWithPhoto(song.coverUrl, extra);
			}
			return;
		}
		await ctx.reply(`共找到 ${results.length} 个结果：\n\n` +
			results.map(song => `${song.title} ${song.id ? '' : '(ID 缺失)'}`).join('\n') +
			// 如果有 ID 缺失就不一定没玩过了
			(results.some(it => !it.id) ? '' : '\n\n可惜你都没玩过'));
	});


	bot.catch(async (err: any, ctx) => {
		console.error(err);
		if (['message is not modified', 'User not bound'].some(it => err?.message?.includes?.(it))) return;
		ctx.reply && await ctx.reply('发生错误：' + err.message);
	});

	return bot;
};
