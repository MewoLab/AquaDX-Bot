import { UserProfile } from '@clansty/maibot-clients';
import { Env, UserProfilesKVStorage } from '@clansty/maibot-types';
import NoReportError from './utils/NoReportError';
import XXH from 'xxhashjs';
import { BotTypes, MessageButton, MessageButtonSwitchInline, MessageButtonSwitchInlineOtherChat, SendMessageAction } from '@clansty/maibot-firm';

export default class UserContext<T extends BotTypes> {
	public constructor(
		private env: Env,
		private fromId: T['ChatId'],
		private reply: () => SendMessageAction<T>,
		private genImage: (url: string, width: number) => Promise<{ data: T['SendableFile'], height: number }>
	) {
	}

	private _profiles?: UserProfile[];
	currentProfileId? = 0;

	async getProfiles() {
		if (this._profiles) return this._profiles;
		const dto = await this.env.KV.get<UserProfilesKVStorage>(`profiles:${this.fromId}`);
		if (!dto) {
			this._profiles = [];
			return [];
		}
		this._profiles = await Promise.all(dto.profiles.map(dto => UserProfile.create(dto, this.env)));
		this.currentProfileId = dto.selected || 0;
		return this._profiles;
	}

	async saveProfiles(profiles: UserProfile[]) {
		this._profiles = profiles;
		await this.env.KV.set(`profiles:${this.fromId}`, {
			profiles: profiles.map(p => p.dto),
			selected: this.currentProfileId
		} satisfies UserProfilesKVStorage);
	}

	async getCurrentProfile(reply = true) {
		const profiles = await this.getProfiles();
		if (!profiles.length && reply) {
			throw new Error('请先使用 /bind 绑定用户');
		}
		if (this.currentProfileId >= profiles.length) {
			this.currentProfileId = 0;
		}
		return profiles[this.currentProfileId];
	}

	async selectProfile(id: number) {
		const profiles = await this.getProfiles();
		if (id >= profiles.length) {
			throw new Error('槽位不存在');
		}
		this.currentProfileId = id;
		await this.saveProfiles(profiles);
	}

	async delProfile(id: number) {
		const profiles = await this.getProfiles();
		if (id >= profiles.length) {
			throw new Error('槽位不存在');
		}
		profiles.splice(id, 1);
		await this.saveProfiles(profiles);
	}

	async getCacheImage(key: any) {
		const hash = XXH.h64(JSON.stringify(key), 0xabcd).toString(16);
		return await this.env.KV.get(`image:${hash}`) as { fileId: string, type: 'image' | 'document' };
	}

	async getWebUrl(type: string, param?: string) {
		const currentProfile = await this.getCurrentProfile(false);
		const currentProfileId = this.currentProfileId;

		let url = `https://maibot-web.pages.dev/${type}/`;
		if (currentProfile.dto.type === 'AquaDX-v2') {
			url += `aquadx/${encodeURIComponent(currentProfile.dto.username)}`;
		} else if (currentProfile.dto.type === 'Minato') {
			url += `minato/${encodeURIComponent(currentProfile.dto.username)}`;
		} else {
			url += `${this.fromId}/${currentProfileId}`;
		}

		if (param) {
			url += `/${param}`;
		}
		return url;
	}


	// 这可能是史
	async genCacheSendImage(key: any, url: string, width: number, filename: string, shareKw?: string, isFromStart = false, inlineKeyboard: MessageButton[][] = []) {
		const hash = XXH.h64(JSON.stringify(key), 0xabcd).toString(16);
		const cached = await this.env.KV.get(`image:${hash}`) as { fileId: string, type: 'image' | 'document' };
		if (cached) {
			const reply = this.reply()
				.addPhoto(cached.fileId);

			if (cached.type === 'image' && shareKw) {
				inlineKeyboard.push([new MessageButtonSwitchInlineOtherChat('分享', shareKw)]);
			} else if (cached?.type === 'document') {
				reply.filesAsDocument();
			}

			await reply
				.setButtons(inlineKeyboard)
				.dispatch();
			return;
		}

		const genMsg = await this.reply()
			.setText('图片生成中...')
			.dispatch();

		const { data, height } = await this.genImage(url, width);
		const messageToSent = this.reply()
			.addPhoto(data);
		if (height / width > 2) {
			messageToSent.filesAsDocument();
		} else if (shareKw) {
			inlineKeyboard.push([new MessageButtonSwitchInlineOtherChat('分享', shareKw)]);
			isFromStart = false;
		}
		const messageSent = await messageToSent
			.setButtons(inlineKeyboard)
			.dispatch();
		if (hash && messageSent.fileId)
			await this.env.KV.set(`image:${hash}`, { fileId: messageSent.fileId, type: height / width > 2 ? 'document' : 'image' });

		try {
			await genMsg.delete();
			console.log('删除消息完成', new Date());
		} catch (e) {
			console.log('删除消息失败', e, '无所谓');
		}

		if (isFromStart) {
			try {
				await this.reply().setText('由于图片高度太高，暂时不支持使用行内模式发送').dispatch();
				console.log('发送高度提示', new Date());
			} catch (e) {
				console.log('发送消息失败', e, '无所谓');
			}
		}
	}
}
