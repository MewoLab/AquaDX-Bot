import { BotTypes } from '@clansty/maibot-firm';
import { BuilderEnv } from '../botBuilder';
import * as repl from 'node:repl';

export default <T extends BotTypes>({ bot, env, getContext, musicToFile, enableOfficialServers }: BuilderEnv<T>) => {
	const INLINE_HELP = `行内模式说明

直接输入 [歌曲ID | 歌曲名称的一部分 | 歌曲别名] 即可搜索歌曲的基本信息
输入 "<code>query</code> [搜索内容]" 来搜索自己的成绩
输入牌子名称（霸者/真极/…）来查询牌子进度
输入 "<code>b50</code>" 来发送 B50 图片

需要生成图片的功能，需要现在对话中生成一次，然后才能在行内模式中发送。可以通过在行内模式中点击按钮来跳转到私聊中生成`;

	const BASE_HELP = `<a href="https://aquadx.net/">AquaDX.Net</a> 查分 & maimai 歌曲查询 Bot
${enableOfficialServers ? `本 Bot 主要基于 AquaDX.Net 制作，同时支持国服和国际服
` : ''}
<b>绑定账号</b>
使用 <b>/bind <code>AquaDX 的用户名</code>${enableOfficialServers ? ' 或 <code>国服微信二维码识别出来的文字</code> 或 <code>AIME 卡背后的 20 位数字（国际服）</code>' : ''}</b> 来绑定账号
支持一个人同时绑定多个账号，可以通过 <b>/profile</b> 来查看和切换绑定的账号
通过 <b>/delprofile</b> 来删除绑定的账号

<b>查歌</b>
使用 <b>/search <code>歌曲名称或者别名</code></b> 来搜索歌曲信息
使用 <b>/query <code>搜索内容</code></b> 来搜索自己的成绩

<b>牌子进度和图片生成</b>
输入 <b><code>牌子名称</code>进度</b> 来查询牌子进度，比如说 <b><code>霸者进度</code></b>
输入 <b><code>牌子名称</code>完成表</b> 来查询指定的牌子 🟣Master 以上难度歌曲的完成情况，将生成图片发送
输入 <b><code>难度</code>完成表</b> 来查询指定难度所有歌曲的完成情况，将生成图片发送，比如说 <b><code>13 完成表</code></b>
使用 <b>/b50</b> 来生成 B50 成绩图

本 Bot 使用的部分歌曲数据及信息来自 <a href="https://dxrating.net">DXRating.net</a>`;

	bot.registerInlineQuery(/^$/, async (event) => {
		await event.answer()
			.withStartButton('行内模式说明', 'help-inline')
			.withCacheTime(3600)
			.dispatch();
		return true;
	});

	bot.registerCommand('help', async (event) => {
		const reply = event.reply()
			.setHtml(BASE_HELP)
			.disableLinkPreview();
		reply.addBundledMessage()
			.setPrompt('[帮助]')
			.setTitle('AquaDX Bot 帮助')
			.setSummary('点击打开查看')
			.addNode()
			.setHtml(BASE_HELP);
		await reply.dispatch();
		return true;
	});

	bot.registerCommand('start', async (event) => {
		const action = event.reply()
			.disableLinkPreview();
		if (event.params[0] === 'help-inline') {
			await action.setHtml(INLINE_HELP)
				.dispatch();
			return true;
		} else if (!event.params.length) {
			await action.setHtml(BASE_HELP)
				.dispatch();
			return true;
		} else return false;
	});
}
