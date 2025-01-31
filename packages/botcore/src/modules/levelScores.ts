import { LEVELS, Song } from '@clansty/maibot-types';
import { BotTypes, MessageButtonUrl } from '@clansty/maibot-firm';
import { BuilderEnv } from '../botBuilder';
import UserContext from '../UserContext';

export default <T extends BotTypes>({ bot, env, getContext, musicToFile }: BuilderEnv<T>) => {
	const sendProgressImage = async (ctx: UserContext<T>, fromId: T['ChatId'], isPrivate: boolean, level: typeof LEVELS[number], isFromStart = false) => {
		const profile = await ctx.getCurrentProfile();
		const requiredSongList = Song.getByCondition(it => it.sheets.some(chart => chart.level === level));
		const userMusic = await profile.getUserMusic(requiredSongList);

		return await ctx.genCacheSendImage([level, userMusic], await ctx.getWebUrl('levelScores', encodeURIComponent(level)),
			2000, `LV ${level} 分数表.png`, isPrivate ? level : undefined, isFromStart, [
				[]
			]);
	};

	for (const level of LEVELS) {
		bot.registerInlineQuery(RegExp(`^ ?\\/?${level.replace('+', '\\+')} ?(分数|成绩)[图列]?表$`), async (event) => {
			const ctx = getContext(event);
			const profile = await ctx.getCurrentProfile();
			if (!profile) {
				await event.answer()
					.withStartButton('请绑定用户', 'bind')
					.isPersonal()
					.withCacheTime(10)
					.dispatch();
				return;
			}

			const requiredSongList = Song.getByCondition(it => it.sheets.some(chart => chart.level === level));
			const userMusic = await profile.getUserMusic(requiredSongList);
			const cachedImage = await ctx.getCacheImage([level, userMusic]);
			const answer = event.answer()
				.isPersonal()
				.withCacheTime(10);
			if (cachedImage?.type === 'image')
				answer.addPhotoResult('pic', cachedImage.fileId);
			else
				answer.withStartButton(`生成 LV ${level} 分数表`, level);
			await answer.dispatch();
			return true;
		});

		bot.registerCommand('start', async (event) => {
			if (event.params[0] !== level) return false;
			const ctx = getContext(event);
			await sendProgressImage(ctx, event.fromId, event.isPrivate, level, true);
			return true;
		});

		bot.registerKeyword(RegExp(`^\/?${level.replace('+', '\\+')} ?(分数|成绩)[图列]?表$`), async (event) => {
			const ctx = getContext(event);
			await sendProgressImage(ctx, event.fromId, event.isPrivate, level);
			return true;
		});
	}
}
