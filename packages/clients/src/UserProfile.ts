import { BUDDIES_LOGO, BUDDIES_PLUS_LOGO, GameVariantPlateMusicList, MaiVersion, PLATE_MUSIC_LIST_145, PLATE_MUSIC_LIST_CN, PLATE_MUSIC_LIST_JP, Regions, Env, Song, UserPreviewSummary, UserProfileDto } from '@clansty/maibot-types';
import { UserSource } from './UserSource';
import AquaDxLegacy from './AquaDxLegacy';
import SdgbProxied from './SdgbProxied';
import AquaDx from './AquaDx';
import { SdgaProxied } from './index';

export class UserProfile {
	private constructor(private readonly _type: UserProfileDto['type'],
		public readonly userId: string | number,
		private readonly client: UserSource,
		public readonly dto: UserProfileDto) {
	}

	static async create(dto: UserProfileDto, env?: Env) {
		let client: UserSource;
		let userId: string | number;
		switch (dto.type) {
			case 'AquaDX':
				client = await AquaDxLegacy.create(env.KV, env.POWERON_TOKEN);
				userId = dto.userId;
				break;
			case 'SDGB':
				client = SdgbProxied.create(env.CF_ACCESS_CLIENT_ID, env.CF_ACCESS_CLIENT_SECRET);
				userId = dto.userId;
				break;
			case 'SDGA':
				client = SdgaProxied.create(env.CF_ACCESS_CLIENT_ID, env.CF_ACCESS_CLIENT_SECRET);
				userId = dto.userId;
				break;
			case 'AquaDX-v2':
				client = new AquaDx();
				userId = dto.username;
		}

		return new this(dto.type, userId, client, dto);
	}

	get type() {
		switch (this._type) {
			case 'AquaDX':
				return 'AquaDX (Legacy)';
			case 'AquaDX-v2':
				return 'AquaDX';
			case 'SDGB':
				return '国服';
			case 'SDGA':
				return '国际服';
			default:
				throw new Error('Unknown user source');
		}
	}

	public get region(): keyof Regions {
		switch (this._type) {
			case 'AquaDX':
			case 'AquaDX-v2':
			case 'SDGA':
				return 'jp';
			case 'SDGB':
				return 'cn';
			default:
		}
	}

	public async plateSongs(): Promise<GameVariantPlateMusicList> {
		switch (this.region) {
			case 'jp':
				switch (await this.getVersion()) {
					case 140:
						return PLATE_MUSIC_LIST_JP;
					case 145:
						return PLATE_MUSIC_LIST_145;
				}
				return PLATE_MUSIC_LIST_JP;
			case 'cn':
				return PLATE_MUSIC_LIST_CN;
			default:
		}
	}

	private _version: MaiVersion | null = null;

	private async _getVersion(): Promise<MaiVersion> {
		switch (this._type) {
			case 'SDGB':
				return 140;
			case 'SDGA':
				return 145;
			case 'AquaDX':
			case 'AquaDX-v2':
				try {
					const preview = await this.getUserPreview();
					const version = Number(preview.lastRomVersion.split('.')[1]);
					if (version < 45)
						return 140;
					else
						return 145;
				} catch (e) {
					console.error('Failed to get user version', e);
					return 140;
				}
		}
	}

	async getVersion() {
		if (this._version === null) {
			this._version = await this._getVersion();
		}
		return this._version;
	}

	async getVersionLogo() {
		const version = await this.getVersion();
		switch (version) {
			case 140:
				return BUDDIES_LOGO;
			case 145:
				return BUDDIES_PLUS_LOGO;
		}
	}

	async getUserMusic(musicIdList: (number | Song)[]) {
		const convertedList = [] as number[];
		for (const music of musicIdList) {
			if (music instanceof Song) {
				const std = music.sheets.find(it => it.type === 'std');
				const dx = music.sheets.find(it => it.type === 'dx');
				std?.internalId && convertedList.push(std.internalId);
				dx?.internalId && convertedList.push(dx.internalId);
			} else {
				convertedList.push(music);
			}
		}
		return this.client.getUserMusic(this.userId, convertedList);
	}

	async getUserRating() {
		return this.client.getUserRating(this.userId);
	}

	private _preview: UserPreviewSummary | null = null;

	private async _getUserPreview() {
		return this.client.getUserPreview(this.userId);
	}

	public async getUserPreview() {
		if (this._preview === null) {
			this._preview = await this._getUserPreview();
		}
		return this._preview;
	}

	async getNameplate() {
		return this.client.getNameplate(this.userId);
	}
}
