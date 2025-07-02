import { CategoryEnum, DifficultyEnum, dxdata, Regions, Song as DataSong, TypeEnum } from '@gekichumai/dxdata';
import Chart from './Chart';
import _ from 'lodash';
import { ALL_MUSIC, ALL_MUSIC_140, ALL_MUSIC_145, ALL_MUSIC_150, JACKET_EXIST_IDS } from '@clansty/maibot-data';
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
		public readonly ver: MaiVersion = 155
	) {
		Object.assign(this, data);

		let allMusic: typeof ALL_MUSIC;
		if (ver === 155) {
			allMusic = ALL_MUSIC;
		} else if (ver === 150) {
			allMusic = ALL_MUSIC_150;
		} else if (ver === 145) {
			allMusic = ALL_MUSIC_145;
		} else if (ver === 140) {
			allMusic = ALL_MUSIC_140;
		} else {
			throw new Error('Unsupported version');
		}
		const stdChart = data.sheets.find(it => it.type === TypeEnum.STD);
		const dxChart = data.sheets.find(it => it.type === TypeEnum.DX);

		this.id = stdChart ? stdChart.internalId : dxChart?.internalId;

		if (this.id) {
			this.id %= 1e4;
		} else {
			// DXRating.net 中一些歌，比如说 LOSER 和俊达萌起床歌，没有 ID
			let findId = Object.entries(allMusic).find(([id, dataFromAllMusic]) => dataFromAllMusic.name === data.title && Number(id) % 1e4 < 2e3);
			if (!findId) {
				findId = Object.entries(allMusic).find(([id, dataFromAllMusic]) => dataFromAllMusic.name?.toLowerCase() === data.title.toLowerCase() && Number(id) % 1e4 < 2e3);
			}
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
	}

	public get coverAvif() {
		if (JACKET_EXIST_IDS.includes(this.id))
			return getAssetUrl(ASSET_TYPE.Jacket, this.id);
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

	public static fromId(id: number, ver: MaiVersion = 155) {
		let allMusic: typeof ALL_MUSIC;
		if (ver === 155) {
			allMusic = ALL_MUSIC;
		} else if (ver === 150) {
			allMusic = ALL_MUSIC_150;
		} else if (ver === 145) {
			allMusic = ALL_MUSIC_145;
		} else if (ver === 140) {
			allMusic = ALL_MUSIC_140;
		} else {
			throw new Error('Unsupported version');
		}
		const dx = id > 1e4;
		id %= 1e4;
		let song = dxdata.songs.find(song => song.sheets.some(sheet => sheet.internalId === id || sheet.internalId === id + 1e4));
		if (song && dx && !song.sheets.some(it => it.type === TypeEnum.DX)) {
			song = null;
		} else if (song && !dx && !song.sheets.some(it => it.type === TypeEnum.STD)) {
			song = null;
		}
		if (song) return new this(song, dx, false, ver);

		const dataFromAllMusic = allMusic[id] || allMusic[id + 1e4];
		if (!dataFromAllMusic) return null;

		song = dxdata.songs.find(song => song.title === dataFromAllMusic.name) ||
			dxdata.songs.find(song => song.title.toLowerCase() === dataFromAllMusic.name.toLowerCase());
		if (song && dx && !song.sheets.some(it => it.type === TypeEnum.DX) && allMusic[id + 1e4]) {
			song = null;
		} else if (song && !dx && !song.sheets.some(it => it.type === TypeEnum.STD) && allMusic[id]) {
			song = null;
		}
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

	public static search(kw: string, ver: MaiVersion = 155) {
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
			if (Number(id) > 1e5) continue;
			if (data.name?.toLowerCase().includes(kw)) {
				results.push(this.fromId(Number(id), ver));
			}
		}
		return _.uniqBy(results, (it) => `${it.id}_${it.title}`);
	}

	public static getByCondition(condition: (song: Song) => boolean, ver: MaiVersion = 155, officialOnly = true): Song[] {
		let tmp = Song.getAllSongs(ver);
		if (officialOnly) {
			tmp = tmp.filter(song => song.id < 2000);
		}
		tmp = tmp.filter(condition);
		return tmp;
	}

	public static allIds = _.uniq(Object.keys(ALL_MUSIC).map(Number).map(it => it % 1e4));
	public static getAllSongs = (ver: MaiVersion = 155) => Song.allIds.filter(it => it < 2000).map(id => Song.fromId(id, ver)).filter(it => it);

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
