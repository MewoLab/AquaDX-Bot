import { Telegraf } from 'telegraf';
import BotContext from '../classes/BotContext';
import { Env } from '../../worker-configuration';

export default (bot: Telegraf<BotContext>, env: Env) => {
	bot.start(Telegraf.reply('Hello'));
	bot.command('bind', async (ctx) => {
		if (ctx.args.length < 1) {
			await ctx.reply('请输入要绑定的 ID');
			return;
		}

		await env.KV.put(`bind:${ctx.from.id}`, ctx.args[0]);
		await ctx.reply(`绑定 ID ${ctx.args[0]} 成功`);
	});
}
