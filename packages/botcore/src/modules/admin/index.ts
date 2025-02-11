import AdminClient from './client';
import NoReportError from '../../utils/NoReportError';
import { BotTypes } from '@clansty/maibot-firm';
import { BuilderEnv } from '../../botBuilder';
import UserContext from '../../UserContext';

export default <T extends BotTypes>({ bot, env, getContext, musicToFile }: BuilderEnv<T>) => {
	const client = new AdminClient(env.ADMIN_SECRET);
	const admins = env.ADMIN_UIDS.split(',');

	const checkAdminUser = (fromId: T['ChatId']) => {
		if (!admins.includes(fromId.toString())) {
			throw new NoReportError('没有权限');
		}
	};

	bot.registerCommand('ban', async (event) => {
		checkAdminUser(event.fromId);

		const username = event.params[0];
		await client.rankingBan(username);
		await event.reply().setText('成功').dispatch();

		return true;
	});

	bot.registerCommand('debug_net_card', async (event) => {
		checkAdminUser(event.fromId);

		const card = event.params[0];
		const req = await client.debugUserProfile(card);
		const data = await req.json() as { card: { id: number, luid: string, extId: number }, games: object[] }[];
		const enc = new TextEncoder();

		const reply = event.reply();
		try {
			reply.addDocument(bot.constructFile(enc.encode(JSON.stringify(data, null, 2)), `${card}.json`));
		} catch (e) {
		}

		const bundle = reply.addBundledMessage();
		bundle.setTitle(`找到的卡片数量: ${data.length}`);
		for (const { card, games } of data) {
			const sub = bundle.addNode().addBundledMessage().setTitle(`卡片 ${card.luid}`).setDescription(`游戏数量: ${games.length}`);
			sub.addNode().setQQMarkdown('```json\n' + JSON.stringify(card, null, 2) + '\n```');
			for (const game of games) {
				sub.addNode().setQQMarkdown('```json\n' + JSON.stringify(game, null, 2) + '\n```');
			}
		}

		await reply.dispatch();

		return true;
	});

	// bot.command('set_my_command', async (ctx) => {
	// 	ctx.transaction('set_my_command');
	// 	checkAdminUser(ctx);
	//
	// 	await ctx.api.setMyCommands(commandListGroup, { scope: { type: 'all_group_chats' } });
	// 	await ctx.api.setMyCommands(commandListPrivate, { scope: { type: 'all_private_chats' } });
	// 	for (const chat_id of admins) {
	// 		try {
	// 			await ctx.api.setMyCommands(commandListAdmin, { scope: { type: 'chat', chat_id } });
	// 		} catch (e) {
	// 			console.error(e);
	// 		}
	// 	}
	// 	await ctx.reply('成功');
	// });

	const sqlTransactionCount = (where: string) => `
      SELECT blob1 AS type,
             sum(_sample_interval) AS count
      FROM aquadx_bot
      WHERE index1 = 'transaction'
        AND ${where}
      GROUP BY type
	`;

	const sqlUserCount = (where: string) => `
      SELECT Count(DISTINCT blob2) as userCount
      FROM aquadx_bot
      WHERE index1 = 'transaction'
        AND ${where}
	`;

	const oneDay = () => `
			timestamp >= toDateTime(${Date.now() / 1000 - 60 * 60 * 24})
      AND timestamp < toDateTime(${Date.now() / 1000})
  `;

	const oneWeek = () => `
			timestamp >= toDateTime(${Date.now() / 1000 - 60 * 60 * 24 * 7})
      AND timestamp < toDateTime(${Date.now() / 1000})
  `;

	// bot.command('stats', async (ctx) => {
	// 	ctx.transaction('stats');
	// 	checkAdminUser(ctx);
	//
	// 	const query = async (sql: string) => {
	// 		const req = await fetch('https://api.cloudflare.com/client/v4/accounts/39a7ded207d46b8e258ee9ee2edee52a/analytics_engine/sql', {
	// 			method: 'POST',
	// 			headers: {
	// 				'Authorization': `Bearer ${env.ANAENG_CF_API_TOKEN}`
	// 			},
	// 			body: sql
	// 		});
	// 		const res = await req.json() as any;
	// 		return res.data as Array<any>;
	// 	};
	//
	// 	let stats = `用户量:\n 日: ${(await query(sqlUserCount(oneDay())))[0].userCount}\n 周: ${(await query(sqlUserCount(oneWeek())))[0].userCount}\n\n` +
	// 		'操作数:\n 日:\n';
	//
	// 	const oneDayData = await query(sqlTransactionCount(oneDay()));
	// 	for (const { type, count } of oneDayData) {
	// 		stats += `  ${type}: ${count}\n`;
	// 	}
	// 	stats += ' 周:\n';
	// 	const oneWeekData = await query(sqlTransactionCount(oneWeek()));
	// 	for (const { type, count } of oneWeekData) {
	// 		stats += `  ${type}: ${count}\n`;
	// 	}
	// 	await ctx.reply(stats);
	// });
}
