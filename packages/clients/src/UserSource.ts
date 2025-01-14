import { Nameplate, UserCombinedRating, UserCombinedRatingChuni, UserMusic, UserMusicChuni, UserPreview, UserPreviewSummary, UserRating } from '@clansty/maibot-types';

export abstract class UserSource {
	protected constructor(protected readonly baseUrl: string) {
	}

	protected makeHeaders(init: HeadersInit) {
		return new Headers(init);
	}

	async getUserMusic(userId: number | string, musicIdList: number[]) {
		console.log('请求 GetUserMusicApi', { userId, musicIdListLength: musicIdList.length });
		const req = await fetch(this.baseUrl + 'GetUserMusicApi', {
			method: 'POST',
			body: JSON.stringify({ userId }),
			headers: this.makeHeaders({ 'Content-Type': 'application/json' })
		});
		const data = await req.json() as any;
		return data.userMusicList[0].userMusicDetailList as UserMusic[];
	}

	protected async _getUserRating(userId: number | string): Promise<UserCombinedRating> {
		console.log('请求 GetUserRatingApi', userId);
		const req = await fetch(this.baseUrl + 'GetUserRatingApi', {
			method: 'POST',
			body: JSON.stringify({ userId }),
			headers: this.makeHeaders({ 'Content-Type': 'application/json' })
		});
		const data = await req.json() as any;
		const rating = data.userRating as UserRating;

		return {
			best35: rating.ratingList,
			best15: rating.newRatingList,
			musicList: await this.getUserMusic(userId, [...rating.ratingList.map(it => it.musicId), ...rating.newRatingList.map(it => it.musicId)])
		};
	}

	private _getUserRatingCache = new Map<number | string, Promise<UserCombinedRating>>();

	// final
	public getUserRating(userId: number | string): Promise<UserCombinedRating> {
		if (this._getUserRatingCache.has(userId)) {
			return this._getUserRatingCache.get(userId);
		}
		const promise = this._getUserRating(userId);
		this._getUserRatingCache.set(userId, promise);
		return promise;
	}

	protected async _getUserPreview(userId: number | string): Promise<UserPreviewSummary> {
		console.log('请求 GetUserPreviewApi', { userId });
		const req = await fetch(this.baseUrl + 'GetUserPreviewApi', {
			method: 'POST',
			body: JSON.stringify({ userId }),
			headers: this.makeHeaders({ 'Content-Type': 'application/json' })
		});

		return await req.json() as UserPreview;
	}

	private _getUserPreviewCache = new Map<number | string, Promise<UserPreviewSummary>>();

	// final
	public getUserPreview(userId: number | string): Promise<UserPreviewSummary> {
		if (this._getUserPreviewCache.has(userId)) {
			return this._getUserPreviewCache.get(userId);
		}
		const promise = this._getUserPreview(userId);
		this._getUserPreviewCache.set(userId, promise);
		return promise;
	}

	public abstract getNameplate(userId: number | string): Promise<Nameplate>;

	public async getChuniUserMusic(userId: number | string, musicIdList: number[]): Promise<UserMusicChuni[]> {
		throw new Error('不支持的账号类型');
	}

	public async getChuniUserRating(userId: number | string): Promise<UserCombinedRatingChuni> {
		throw new Error('不支持的账号类型');
	}

	public async getChuniUserPreview(userId: number | string): Promise<UserPreviewSummary> {
		throw new Error('不支持的账号类型');
	}
}
