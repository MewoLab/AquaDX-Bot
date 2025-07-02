import { BUDDIES_LOGO, BUDDIES_PLUS_LOGO, GameVariantPlateMusicList, MaiVersion, PLATE_MUSIC_LIST_145, PLATE_MUSIC_LIST_CN, PLATE_MUSIC_LIST_JP, Regions, Env, Song, UserPreviewSummary, UserProfileDto, PRISM_LOGO, PLATE_MUSIC_LIST_150, ChuniSong, PLATE_MUSIC_LIST_155, PRISM_PLUS_LOGO } from '@clansty/maibot-types';
import { UserSource } from './UserSource';
import AquaDxLegacy from './AquaDxLegacy';
import SdgbProxied from './SdgbProxied';
import AquaDx from './AquaDx';
import { SdgaProxied } from './index';
import Minato from './Minato';

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
				break;
			case 'Minato':
				client = new Minato();
				userId = dto.username;
				break;
		}

		return new this(dto.type, userId, client, dto);
	}

	get type() {
		switch (this._type) {
			case 'AquaDX':
				return 'AquaDX (Legacy)';
			case 'AquaDX-v2':
				return 'AquaDX';
			case 'Minato':
				return 'Minato（测试）';
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
			case 'Minato':
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
					case 155:
						return PLATE_MUSIC_LIST_155;
					case 150:
						return PLATE_MUSIC_LIST_150;
					case 145:
						return PLATE_MUSIC_LIST_145;
					case 140:
						return PLATE_MUSIC_LIST_JP;
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
				return 150;
			case 'AquaDX':
			case 'AquaDX-v2':
			case 'Minato':
				try {
					const preview = await this.getUserPreview();
					const version = Number(preview.lastRomVersion.split('.')[1]);
					console.log('User version:', version);
					if (version < 45)
						return 140;
					else if (version < 50)
						return 145;
					else if (version < 55)
						return 150;
					else
						return 155;
				} catch (e) {
					console.error('Failed to get user version', e);
					return 150;
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
			case 150:
				return PRISM_LOGO;
			case 155:
				return PRISM_PLUS_LOGO;
		}
	}

	async getUserMusic(musicIdList: (number | Song)[]) {
		const convertedList = [] as number[];
		for (const music of musicIdList) {
			if (music instanceof Song) {
				convertedList.push(music.id % 1e4);
				convertedList.push(music.id % 1e4 + 1e4);
			} else {
				convertedList.push(music % 1e4);
				convertedList.push(music % 1e4 + 1e4);
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

	async getChuniUserMusic(musicIdList: (number | ChuniSong)[]) {
		const convertedList = [] as number[];
		for (const music of musicIdList) {
			if (music instanceof ChuniSong) {
				convertedList.push(music.id);
			} else {
				convertedList.push(music);
			}
		}
		return this.client.getChuniUserMusic(this.userId, convertedList);
	}

	async getChuniUserRating() {
		return this.client.getChuniUserRating(this.userId);
	}

	async getChuniUserPreview() {
		return this.client.getChuniUserPreview(this.userId);
	}
}
