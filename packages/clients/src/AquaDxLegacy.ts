import { KVStorage, UserData } from '@clansty/maibot-types';
import { UserSource } from './UserSource';

export default class AquaDxLegacy extends UserSource {
	private static async powerOn(baseUrl: string, token: string) {
		const init = {
			method: 'POST',
			body: token
		};
		// @ts-ignore
		if (typeof window !== 'undefined') {
			// @ts-ignore
			init.cache = 'no-store';
		}
		const req = await fetch(baseUrl + '/sys/servlet/PowerOn', init);
		const res = new URLSearchParams(await req.text());
		return res.get('uri') as string;
	}

	public static async create(kv: KVStorage, powerOnToken: string) {
		// let uri = await kv.get<string>('apiBase');
		// if (!uri) {
		// 	console.log('请求 powerOn');
		// 	uri = await AquaDxLegacy.powerOn('http://aquadx-cf.hydev.org', powerOnToken);
		// 	const url = new URL(uri);
		// 	// 不然会出现不会自动解压 deflate 的问题
		// 	url.host = 'aquadx-cf.hydev.org';
		// 	uri = url.toString();
		// 	await kv.set('apiBase', uri, 172800);
		// }
		return new this('https://example.com/');
	}

	public async getUserData(userId: number) {
		console.log('请求 GetUserDataApi', { userId });
		const req = await fetch(this.baseUrl + 'GetUserDataApi', {
			method: 'POST',
			body: JSON.stringify({ userId }),
			headers: { 'Content-Type': 'application/json' }
		});

		return (await req.json() as any).userData as UserData;
	}

	public async getNameplate(userId: number): Promise<UserData> {
		return await this.getUserData(userId);
	}
}
