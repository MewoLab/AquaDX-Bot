import _ from 'lodash';
import { CHU_ALL_MUSIC as ALL_MUSIC, CHU_JACKET_EXIST_IDS as JACKET_EXIST_IDS } from '@clansty/maibot-data';
import { CHU_LEVEL_EMOJI as LEVEL_EMOJI } from './consts';
import { MaiVersion } from './types';
import { ASSET_TYPE, getAssetUrl } from '@clansty/maibot-utils/src/getAssetUrl';

export default class ChuniSong {
	name: string;
	ver: string;
	composer: string;
	genre: any;
	worldsEndTag: string;
	worldsEndStars: string;
	notes: { lv: number }[];
	
	get title() {
		return this.name;
	}
	
	get artist() {
		return this.composer;
	}
	
	get category() {
		return this.genre;
	}

	private constructor(public readonly id: number, data: typeof ALL_MUSIC[48]) {
		Object.assign(this, data);
	}

	public get coverUrl() {
		if (JACKET_EXIST_IDS.includes(this.id))
			return getAssetUrl(ASSET_TYPE.ChuniJacketPng, this.id);
	}

	public get coverAvif() {
		if (JACKET_EXIST_IDS.includes(this.id))
			return getAssetUrl(ASSET_TYPE.ChuniJacket, this.id);
	}

	public get basicInfo() {
		let message = this.name + '\n\n' +
			`作曲:\t${this.composer}\n` +
			// (this.bpm ? `BPM:\t${this.bpm}\n` : '') +
			`分类:\t${this.genre}`;

		if (this.id) {
			message = this.id + '. ' + message;
		}

		return message;
	}

	public get display() {
		let message = this.basicInfo + '\n';

		for (let i = 0; i < this.notes.length; i++) {
			message += `\n${LEVEL_EMOJI[i]} ${this.notes[i].lv.toFixed(1)}`;
		}
		return message;
	}

	public static fromId(id: number) {
		const dataFromAllMusic = ALL_MUSIC[id];
		if (!dataFromAllMusic) return null;

		return new this(id, dataFromAllMusic);
	}

	public static search(kw: string, ver: MaiVersion = 150) {
		const results = [] as ChuniSong[];
		if (Number(kw)) {
			const song = this.fromId(Number(kw));
			song && results.push(song);
		}
		for (const [id, data] of Object.entries(ALL_MUSIC)) {
			if (data.name?.toLowerCase().includes(kw)) {
				results.push(new this(Number(id), data));
			}
		}
		return _.uniqBy(results, (it) => `${it.id}_${it.name}`);
	}

	public static getByCondition(condition: (song: ChuniSong) => boolean) {
		let tmp = ChuniSong.getAllSongs();
		tmp = tmp.filter(condition);
		return tmp;
	}

	public static allIds = _.uniq(Object.keys(ALL_MUSIC).map(Number));
	public static getAllSongs = () => ChuniSong.allIds.map(id => ChuniSong.fromId(id)).filter(it => it);
}
