import { BotTypes } from '@clansty/maibot-firm';
import { BuilderEnv } from '../botBuilder';

export default <T extends BotTypes>({ bot, env, getContext }: BuilderEnv<T>) => {
	bot.registerCommand('export', async (event) => {
		const ctx = getContext(event);
		const profile = await ctx.getCurrentProfile();
		const enc = new TextEncoder();

		const userMusicDetailList = await profile.getUserMusic([]);
		await event.reply()
			.addDocument(bot.constructFile(enc.encode(JSON.stringify({
				userMusicList: [{
					userMusicDetailList
				}]
			}, null, 2)), 'userMusic.json'))
			.dispatch();

		return true;
	});
}