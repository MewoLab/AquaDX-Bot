import { ALL_MUSIC } from '@clansty/maibot-data';
import fsP from 'node:fs/promises';
import _ from 'lodash';

const allMusic = Object.entries(ALL_MUSIC)
	.filter(([strId, content]) => {
		// 移除自制谱
		const id = Number(strId);
		return id < 1e5 && id % 1e4 < 2e3;
	})
	.map(([id, content]) => ({
		...content,
		id: Number(id)
	}));

const allIds = _.uniq(allMusic.map((item) => item.id % 1e4));

await fsP.writeFile('./all-music-vrc.json', JSON.stringify({ allMusic, allIds }, null, 0));
