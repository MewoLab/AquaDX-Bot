import { LEVELS, Song } from '@clansty/maibot-types';
import { BotTypes, MessageButtonUrl } from '@clansty/maibot-firm';
import { BuilderEnv } from '../botBuilder';
import UserContext from '../UserContext';

export default <T extends BotTypes>({ bot, env, getContext, musicToFile }: BuilderEnv<T>) => {
	const sendProgressImage = async (ctx: UserContext<T>, fromId: T['ChatId'], isPrivate: boolean, level: typeof LEVELS[number], isFromStart = false) => {
		const profile = await ctx.getCurrentProfile();
		const requiredSongList = Song.getByCondition(it => it.sheets.some(chart => chart.level === level));
		const userMusic = await profile.getUserMusic(requiredSongList);

		return await ctx.genCacheSendImage([level, userMusic], await ctx.getWebUrl('levelProgress', encodeURIComponent(level)),
			1500, `LV ${level} 完成表.png`, isPrivate ? level : undefined, isFromStart, [
				[new MessageButtonUrl('查看详情', `tg://resolve?domain=AquaDXBot&appname=webapp&startapp=${encodeURIComponent(btoa(`/levelProgress/${fromId}/${ctx.currentProfileId}/${encodeURIComponent(level)}`))}`)]
			]);
	};

	for (const level of LEVELS) {
		bot.registerInlineQuery(RegExp(`^ ?\\/?${level} ?(进度)?(完成表)?$`), async (event) => {
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
				// 不知道为什么，带 + 的等级都显示不出来
				answer.withStartButton(`生成 LV ${level} 完成表`, level);
			await answer.dispatch();
			return true;
		});

		bot.registerCommand('start', async (event) => {
			if (event.params[0] !== level) return false;
			const ctx = getContext(event);
			await sendProgressImage(ctx, event.fromId, event.isPrivate, level, true);
			return true;
		});

		bot.registerKeyword(RegExp(`^\\/?${level.replace('+', '\\+')} ?(进度|完成[图表])$`), async (event) => {
			const ctx = getContext(event);
			await sendProgressImage(ctx, event.fromId, event.isPrivate, level);
			return true;
		});
	}
}
