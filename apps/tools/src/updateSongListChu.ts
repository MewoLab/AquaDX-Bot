import { CHU_ALL_MUSIC } from '@clansty/maibot-data';
import fs from 'node:fs';
import fsP from 'node:fs/promises';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';

const data = CHU_ALL_MUSIC;
const baseDir = process.argv[2];
const parser = new XMLParser();
const skipWhenExist = process.argv[3] === 'skip';
const optionDirs = await fsP.readdir(path.join(baseDir, 'option'));

for (const opt of [path.join(baseDir, 'data', 'A000'), ...optionDirs.map(d => path.join(baseDir, 'option', d))]) {
	if (!fs.existsSync(path.join(opt, 'music'))) continue;

	for (const f of await fsP.readdir(path.join(opt, 'music'))) {
		if (!f.startsWith('music')) continue;
		if (!fs.existsSync(path.join(opt, 'music', f, 'Music.xml'))) continue;

		const meta = parser.parse(await fsP.readFile(path.join(opt, 'music', f, 'Music.xml'), 'utf-8'));
		let music: typeof CHU_ALL_MUSIC[48] = {};
		if (data[meta.MusicData.name.id]) {
			if (skipWhenExist)
				continue;
			music = data[meta.MusicData.name.id];
		} else {
			data[meta.MusicData.name.id] = music;
		}

		music.name = meta.MusicData.name.str.toString();
		console.log(music.name);
		music.ver = meta.MusicData.releaseTagName.str.toString();
		music.composer = meta.MusicData.artistName.str.toString();
		music.genre = meta.MusicData.genreNames.list.StringID.str.toString();
		if (!music.genre) console.log(meta.MusicData.genreNames);
		music.worldsEndStars = meta.MusicData.starDifType.toString();
		music.worldsEndTag = meta.MusicData.worldsEndTagName.str.toString();

		music.notes = [];
		for (let i = 0; i < 5; i++) {
			music.notes.push({
				lv: Number.parseFloat(`${meta.MusicData.fumens.MusicFumenData[i].level}.${meta.MusicData.fumens.MusicFumenData[i].levelDecimal}`)
			});
		}
		for (let i = music.notes.length - 1; i > -1; i--) {
			if (!music.notes[i].lv) music.notes.pop();
			else break;
		}
	}
}

await fsP.writeFile('./chu-all-music.json', JSON.stringify(data, null, '\t'));
