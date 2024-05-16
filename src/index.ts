/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { Telegraf } from 'telegraf';
import AquaApi from './api';
import compute from './compute';
import { BA_VE } from './consts';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.API_SECRET) {
			console.log('Secret-Token 错误');
			return new Response();
		}
		try {
			const bot = new Telegraf(env.BOT_TOKEN);
			const api = await AquaApi.create(env.KV, env.API_BASE, env.POWERON_TOKEN);


			bot.start(Telegraf.reply('Hello'));
			bot.command('bind', async (ctx) => {
				if (ctx.args.length < 1) {
					await ctx.reply('请输入要绑定的用户名');
					return;
				}

				await env.KV.put(`bind:${ctx.from.id}`, ctx.args[0]);
				await ctx.reply(`绑定用户名 ${ctx.args[0]} 成功`);
			});

			bot.hears(['/', ''].map(it => it + '霸者进度'), async (ctx) => {
				const userId = Number(await env.KV.get(`bind:${ctx.from.id}`));
				const userMusic = await api.getUserMusic(userId);
				await ctx.reply(compute.calcProgress(userMusic, BA_VE));
			});


			const req = await request.json();
			console.log(req);
			await bot.handleUpdate(req as any);
		} catch (e) {
			console.log(e);
		}
		return new Response();
	}
};
