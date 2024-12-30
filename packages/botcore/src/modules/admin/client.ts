export default class AdminClient {
	constructor(private readonly secret: string) {
	}

	private readonly BASE_URL = 'https://aquadx.net/aqua/api/v2/bot';

	private async baseRequest(method: string, params: Record<string, string> = {}) {
		const url = new URL(`${this.BASE_URL}/${method}`);
		const search = new URLSearchParams(params);
		search.set('secret', this.secret);
		url.search = search.toString();

		const res = await fetch(url, {
			method: 'POST'
		});
		if (!res.ok) {
			throw new Error(await res.text());
		}
		return res;
	}

	public async rankingBan(username: string) {
		await this.baseRequest('ranking-ban', { username });
	}

	public async debugUserProfile(cardId: string) {
		return await this.baseRequest('debug-user-profile', { cardId });
	}
}
