import { CategoryEnum, DifficultyEnum, dxdata, Regions, Song as DataSong, TypeEnum } from '@gekichumai/dxdata';
import Chart from './Chart';
import _ from 'lodash';
import { ALL_MUSIC, ALL_MUSIC_140, JACKET_EXIST_IDS } from '@clansty/maibot-data';
import { LEVEL, LEVEL_EN } from './consts';
import { MaiVersion } from './types';
import { ASSET_TYPE, getAssetUrl } from '@clansty/maibot-utils/src/getAssetUrl';

export default class Song implements DataSong {
	songId: never;
	searchAcronyms: string[];
	category: CategoryEnum;
	title: string;
	artist: string;
	bpm: number;
	imageName: string;
	isNew: boolean;
	isLocked: boolean;
	sheets: Chart[];

	// 一定是 1e4 以内的数
	public readonly id: number;

	private constructor(data: DataSong,
		public readonly dx?: boolean,
		// 指 DXRating 中没有的歌
		public readonly unlisted = false,
		public readonly ver: MaiVersion = 145
	) {
		Object.assign(this, data);

		const allMusic = ver === 145 ? ALL_MUSIC : ALL_MUSIC_140;
		const stdChart = data.sheets.find(it => it.type === TypeEnum.STD);
		const dxChart = data.sheets.find(it => it.type === TypeEnum.DX);

		this.id = stdChart ? stdChart.internalId : dxChart?.internalId;

		if (this.id) {
			this.id %= 1e4;
		} else {
			// DXRating.net 中一些歌，比如说 LOSER 和俊达萌起床歌，没有 ID
			const findId = Object.entries(allMusic).find(([id, dataFromAllMusic]) => dataFromAllMusic.name?.toLowerCase() === data.title.toLowerCase());
			if (findId) {
				this.id = Number(findId[0]) % 1e4;
				// console.log('修复了 ID 丢失', data.title, this.id);
			} else {
				console.log('修复不了 ID 丢失', data.title);
			}
		}

		const stdDataFromAllMusic = allMusic[this.id];
		const dxDataFromAllMusic = allMusic[this.id + 1e4];

		this.sheets = data.sheets.map(sheet => new Chart(sheet,
			// 缓解 DXRating.net 定数错误
			sheet.type === TypeEnum.DX ? dxDataFromAllMusic : stdDataFromAllMusic,
			this.id && (sheet.type === TypeEnum.DX ? this.id + 1e4 : this.id),
			this.ver));
	}

	public get dxId() {
		if (this.dx) return this.id + 1e4;
		if (this.dx === undefined && !this.sheets.find(it => it.type === TypeEnum.STD)) return this.id + 1e4;
		return this.id;
	}

	public get coverUrl() {
		if (JACKET_EXIST_IDS.includes(this.id))
			return getAssetUrl(ASSET_TYPE.JacketPng, this.id);
		if (this.imageName)
			return 'https://shama.dxrating.net/images/cover/v2/' + this.imageName;
	}

	public get coverAvif() {
		if (JACKET_EXIST_IDS.includes(this.id))
			return getAssetUrl(ASSET_TYPE.Jacket, this.id);
		if (this.imageName)
			return 'https://shama.dxrating.net/images/cover/v2/' + this.imageName;
	}

	public get basicInfo() {
		let message = this.title + '\n\n' +
			`作曲:\t${this.artist}\n` +
			(this.bpm ? `BPM:\t${this.bpm}\n` : '') +
			`分类:\t${this.category}`;

		if (this.id) {
			message = this.id + '. ' + message;
		}

		return message;
	}

	public get display() {
		let message = this.basicInfo;

		const regionDisplay = (reg: Regions) => {
			let toAdd = '';
			if (reg.cn) toAdd += '🇨🇳';
			if (reg.jp) toAdd += '🇯🇵';
			if (reg.intl) toAdd += '🌍';
			if (toAdd) {
				return `\n可玩区域:\t${toAdd}`;
			}
			if (this.id < 2000) {
				return '\n🗑 删除曲';
			}
			return '';
		};

		const std = this.sheets.find(it => it.type === TypeEnum.STD);
		const dx = this.sheets.find(it => it.type === TypeEnum.DX);

		if (std) {
			message += `\n\n标准谱面`;
			if (std.version) {
				message += `\n添加版本:\t${std.version}`;
			}
			message += regionDisplay(std.regions);
		}
		for (const chart of this.sheets.filter(it => it.type === TypeEnum.STD)) {
			message += '\n' + chart.displayInline;
		}
		if (dx) {
			message += `\n\nDX 谱面`;
			if (dx.version) {
				message += `\n添加版本:\t${dx.version}`;
			}
			message += regionDisplay(dx.regions);
		}
		for (const chart of this.sheets.filter(it => it.type === TypeEnum.DX)) {
			message += '\n' + chart.displayInline;
		}
		return message;
	}

	public static fromId(id: number, ver: MaiVersion = 145) {
		const allMusic = ver === 145 ? ALL_MUSIC : ALL_MUSIC_140;
		const dx = id > 1e4;
		id %= 1e4;
		let song = dxdata.songs.find(song => song.sheets.some(sheet => sheet.internalId === id || sheet.internalId === id + 1e4));
		if (song) return new this(song, dx, false, ver);

		const dataFromAllMusic = allMusic[id] || allMusic[id + 1e4];
		if (!dataFromAllMusic) return null;

		song = dxdata.songs.find(song => song.title.toLowerCase() === dataFromAllMusic.name.toLowerCase());
		if (song) return new this(song, dx, false, ver);

		const sheets = dataFromAllMusic.notes.map((chart, index) => new Chart({
			difficulty: LEVEL_EN[index],
			internalId: dx ? id + 1e4 : id,
			type: dx ? TypeEnum.DX : TypeEnum.STD,
			level: undefined,
			regions: { cn: false, intl: false, jp: false },
			version: undefined,
			noteCounts: undefined,
			noteDesigner: '',
			internalLevelValue: chart?.lv,
			isSpecial: undefined
		}, dataFromAllMusic, dx ? id + 1e4 : id));

		for (let i = sheets.length - 1; i > -1; i--) {
			if (!sheets[i].internalLevelValue) sheets.pop();
			else break;
		}

		return new this({
			title: dataFromAllMusic.name,
			artist: dataFromAllMusic.composer,
			bpm: undefined,
			category: dataFromAllMusic.genre as unknown as CategoryEnum,
			imageName: undefined,
			isNew: false,
			isLocked: false,
			searchAcronyms: [],
			songId: undefined,
			sheets
		}, dx, true, ver);
	}

	public static search(kw: string, ver: MaiVersion = 145) {
		const results = [] as Song[];
		if (Number(kw)) {
			const song = this.fromId(Number(kw), ver);
			song && results.push(song);
		}
		for (const songRaw of dxdata.songs) {
			if (songRaw.title.toLowerCase().includes(kw)) {
				results.push(new this(songRaw, undefined, false, ver));
			} else if (songRaw.searchAcronyms.some(alias => alias === kw)) {
				results.push(new this(songRaw, undefined, false, ver));
			}
		}
		for (const [id, data] of Object.entries(ALL_MUSIC)) {
			// 移除自制谱
			if (Number(id) % 1e4 > 2e3) continue;
			if (data.name?.toLowerCase().includes(kw)) {
				results.push(this.fromId(Number(id), ver));
			}
		}
		return _.uniqBy(results, 'id');
	}

	public static getByCondition(condition: (song: DataSong) => boolean, ver: MaiVersion = 145) {
		return dxdata.songs.filter(condition).map(songRaw => new this(songRaw, undefined, false, ver));
	}

	public static getAllIds = () => Object.keys(ALL_MUSIC).map(Number).map(it => it % 1e4);

	public getChart(difficulty: DifficultyEnum | number | typeof LEVEL[number], dx = this.dx) {
		if (LEVEL.includes(difficulty as any)) {
			difficulty = LEVEL.indexOf(difficulty as any);
		}
		if (typeof difficulty === 'number') {
			difficulty = LEVEL_EN[difficulty];
		}
		if (dx === undefined) {
			return this.sheets.find(sheet => sheet.difficulty === difficulty);
		}
		return this.sheets.find(sheet => sheet.type === (dx ? 'dx' : 'std') && sheet.difficulty === difficulty);
	}
}
