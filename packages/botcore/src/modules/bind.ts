import { SdgaProxied, SdgbProxied, UserProfile } from '@clansty/maibot-clients';
import _ from 'lodash';
import { BotTypes, MessageButtonCallback, SendMessageAction } from '@clansty/maibot-firm';
import { BuilderEnv } from '../botBuilder';
import UserContext from '../UserContext';

export default <T extends BotTypes>({ bot, env, getContext, musicToFile, enableOfficialServers }: BuilderEnv<T>) => {
	const handleQueryBind = async (ctx: UserContext<T>, reply: SendMessageAction<T>) => {
		const profiles = await ctx.getProfiles();
		let bond = '';
		if (profiles.length) {
			bond += `\n\n现在已经绑定 ${profiles.length} 个账号\n使用 /profile 命令来查看已经绑定的账号\n使用 /delprofile 命令可以删除已经绑定的账号`;
		}
		await reply
			.setHtml('用法: /bind <code>AquaDX 的用户名</code>' + (enableOfficialServers ? ' 或 <code>国服微信二维码识别出来的文字</code> 或 <code>AIME 卡背后的 20 位数字（国际服）</code>' : '') + bond)
			.dispatch();
	};

	bot.registerCommand('start', async (event) => {
		if (event.params[0] !== 'bind') return false;
		const ctx = getContext(event);
		await handleQueryBind(ctx, event.reply());
		return true;
	});

	bot.registerCommand('bind', async (event) => {
		const ctx = getContext(event);
		const profiles = await ctx.getProfiles();

		if (event.params.length < 1) {
			await handleQueryBind(ctx, event.reply());
			return true;
		}

		const param = event.params.join('');
		let profile: UserProfile;

		if (/^\d{20}$/.test(param) && enableOfficialServers) { // is AIME
			const client = SdgaProxied.create(env.CF_ACCESS_CLIENT_ID, env.CF_ACCESS_CLIENT_SECRET);
			try {
				const { userId, authKey } = await client.resolveAime(param);
				profile = await UserProfile.create({ type: 'SDGA', userId, authKey, aime: param }, env);
			} catch (e) {
				await event.reply()
					.setText('绑定失败\n' + e.message)
					.dispatch();
				return true;
			}
		} else if (!isNaN(Number(param))) { // is number
			await event.reply()
				.setText('现在请使用用户名绑定 AquaDX 的账号')
				.dispatch();
			// profile = await UserProfile.create({ type: 'AquaDX', userId: Number(param) }, env);
		} else if (param.startsWith('SGWCMAI' + 'D') && param.length === 64 + 8 + 12 && enableOfficialServers) {
			const client = SdgbProxied.create(env.CF_ACCESS_CLIENT_ID, env.CF_ACCESS_CLIENT_SECRET);
			try {
				const userId = await client.resolveChime(param);
				profile = await UserProfile.create({ type: 'SDGB', userId }, env);
			} catch (e) {
				await event.reply()
					.setText('绑定失败\n' + e.message)
					.dispatch();
				return true;
			}
		} else {
			profile = await UserProfile.create({ type: 'AquaDX-v2', username: param }, env);
		}

		profiles.push(profile);
		const userPreview = await profile.getUserPreview();

		await ctx.saveProfiles(profiles);
		await ctx.selectProfile(profiles.length - 1);
		let text = `成功绑定用户 ${userPreview.userName}，DX Rating ${userPreview.playerRating}\n账号槽位 ${profiles.length}\n\n使用 /profile 命令来查看已经绑定的账号`;
		if (profiles.length > 1) {
			text += `\n使用 "/profile <槽位ID>" 来切换当前选择的账号`;
		}
		await event.reply()
			.setText(text)
			.dispatch();
		return true;
	});

	const getProfilesText = async (ctx: UserContext<T>) => {
		const profiles = await ctx.getProfiles();
		const current = await ctx.getCurrentProfile(false);

		const text = await Promise.all(
			profiles.map(async (p, i) => {
				const text = `${i + 1}. ${p.type} ${p.userId}`;
				if (p === current) {
					return `<b>${text}</b> (选中)`;
				}
				return text;
			}));

		return text.join('\n');
	};

	bot.registerCommand(['profile', 'profiles'], async (event) => {
		const ctx = getContext(event);
		const profiles = await ctx.getProfiles();
		if (!profiles.length) {
			await event.reply()
				.setText('请先绑定用户')
				.dispatch();
			return true;
		}

		if (!event.params.length) {
			if (!event.isPrivate) {
				await event.reply()
					.setText('请在私聊中使用此命令')
					.dispatch();
				return true;
			}
			const reply = event.reply()
				.setHtml(await getProfilesText(ctx));
			if (profiles.length > 1) {
				reply.setButtons(_.chunk(profiles.map((_, i) => (
					new MessageButtonCallback((i + 1).toString(), `select_profile:${i}`))), 4));
			}
			await reply.dispatch();
			return true;
		}

		const index = Number(event.params[0]) - 1;
		if (isNaN(index) || index < 0 || index >= profiles.length) {
			await event.reply()
				.setText('槽位不存在')
				.dispatch();
			return true;
		}

		await ctx.selectProfile(index);
		await event.reply()
			.setText('切换成功')
			.dispatch();
		return true;
	});

	bot.registerCallbackQuery(/^select_profile:(\d+)$/, async (event) => {
		const index = Number(event.match[1]);
		const ctx = getContext(event);
		await ctx.selectProfile(index);
		await event.answer().withNotify('切换成功').dispatch();
		await event.editMessage()
			.setHtml(await getProfilesText(ctx))
			.setButtons(_.chunk((await ctx.getProfiles()).map((_, i) => (
				new MessageButtonCallback((i + 1).toString(), `select_profile:${i}`))), 4))
			.dispatch();
		return true;
	});

	bot.registerCommand(['delprofile', 'delprofiles', 'rmprofile', 'rmprofiles'], async (event) => {
		const ctx = getContext(event);
		const profiles = await ctx.getProfiles();
		if (!profiles.length) {
			await event.reply()
				.setText('请先绑定用户')
				.dispatch();
			return true;
		}

		if (!event.params.length) {
			if (!event.isPrivate) {
				await event.reply()
					.setText('请在私聊中使用此命令')
					.dispatch();
				return true;
			}
			await event.reply()
				.setHtml(await getProfilesText(ctx))
				.setButtons(_.chunk(profiles.map(
						(_, i) => new MessageButtonCallback((i + 1).toString(), `del_profile:${i}`))
					, 4))
				.dispatch();
			return true;
		}

		const index = Number(event.params[0]) - 1;
		if (isNaN(index) || index < 0 || index >= profiles.length) {
			await event.reply()
				.setText('槽位不存在')
				.dispatch();
			return true;
		}

		await ctx.delProfile(index);
		await event.reply()
			.setText('删除成功')
			.dispatch();
		return true;
	});

	bot.registerCallbackQuery(/^del_profile:(\d+)$/, async (event) => {
		const ctx = getContext(event);
		const index = Number(event.match[1]);
		await ctx.delProfile(index);
		await event.answer().withNotify('删除成功').dispatch();
		await event.editMessage()
			.setHtml(await getProfilesText(ctx))
			.setButtons(_.chunk((await ctx.getProfiles()).map((_, i) => new MessageButtonCallback((i + 1).toString(), `del_profile:${i}`), 4)))
			.dispatch();
		return true;
	});
}
