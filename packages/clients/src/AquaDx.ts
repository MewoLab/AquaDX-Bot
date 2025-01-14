import { UserSource } from './UserSource';
import { Nameplate } from '@clansty/maibot-types';

export default class AquaDx extends UserSource {
	private readonly BASE_URL = 'https://aquadx.net/aqua';

	public constructor() {
		// all override
		super(null);
	}

	private async fetch(endpoint: string, query: Record<string, string>, method = 'GET', body?: any) {
		const url = new URL(this.BASE_URL + endpoint);
		url.search = new URLSearchParams(query).toString();
		const init = {
			method,
			body: body ? JSON.stringify(body) : undefined,
			headers: body ? { 'Content-Type': 'application/json' } : undefined
		};
		// @ts-ignore
		if (typeof window !== 'undefined') {
			// @ts-ignore
			init.cache = 'no-store';
		}
		const req = await fetch(url, init);
		if (!req.ok) {
			console.error(await req.text());
			throw new Error(`获取数据时出错: ${req.statusText}`);
		}
		return await req.json() as any;
	}

	public override async getUserMusic(username: string, musicIdList: number[]) {
		console.log('请求 user-music-from-list', { username, musicIdListLength: musicIdList.length });
		return await this.fetch('/api/v2/game/mai2/user-music-from-list', { username }, 'POST', musicIdList);
	}

	public override async getNameplate(username: string): Promise<Nameplate> {
		console.log('请求 user-name-plate', { username });
		return await this.fetch('/api/v2/game/mai2/user-name-plate', { username });
	}

	protected override async _getUserRating(username: string) {
		console.log('请求 user-rating', { username });
		const data = await this.fetch('/api/v2/game/mai2/user-rating', { username });
		for (const key of ['best35', 'best15']) {
			data[key] = data[key].map(([musicId, level, romVersion, achievement]) => ({
				musicId: parseInt(musicId),
				level: parseInt(level),
				romVersion: parseInt(romVersion),
				achievement: parseInt(achievement)
			}));
		}
		return data;
	}

	protected override async _getUserPreview(username: string) {
		console.log('请求 user-summary', { username });
		const res = await this.fetch('/api/v2/game/mai2/user-summary', { username });

		// 只需要返回这两个
		return {
			userName: res.name,
			playerRating: res.rating,
			lastRomVersion: res.lastVersion
		};
	}

	public override async getChuniUserMusic(username: string, musicIdList: number[]) {
		return await this.fetch('/api/v2/game/chu3/user-music-from-list', { username }, 'POST', musicIdList);
	}

	public override async getChuniUserRating(username: string) {
		const data = await this.fetch('/api/v2/game/chu3/user-rating', { username });
		for (const key of ['best30', 'recent10']) {
			data[key] = data[key].map(([musicId, level, achievement]) => ({
				musicId: parseInt(musicId),
				level: parseInt(level),
				achievement: parseInt(achievement)
			}));
		}
		return data;
	}

	public override async getChuniUserPreview(username: string) {
		const res = await this.fetch('/api/v2/game/chu3/user-summary', { username });

		// 只需要返回这两个
		return {
			userName: res.name,
			playerRating: res.rating,
			lastRomVersion: res.lastVersion
		};
	}
}
