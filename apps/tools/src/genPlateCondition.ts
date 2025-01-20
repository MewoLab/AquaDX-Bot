import { XMLParser } from 'fast-xml-parser';
import fs from 'node:fs';
import fsP from 'node:fs/promises';

const PLATE_NAME = '真超檄橙晓桃樱紫堇白雪辉舞熊华爽煌宙星祭祝双宴'.split('');
const PLATE_NAME_GAME = '真超檄橙暁桃櫻紫菫白雪輝舞熊華爽煌宙星祭祝双宴'.split('');

const baseDir = process.argv[2];
const parser = new XMLParser();

const result = {} as any;

for (const aDir of await fsP.readdir(baseDir)) {
	if (fs.existsSync(`${baseDir}/${aDir}/musicGroup`)) {
		for (const x of await fsP.readdir(`${baseDir}/${aDir}/musicGroup`)) {
			const meta = parser.parse(await fsP.readFile(`${baseDir}/${aDir}/musicGroup/${x}/MusicGroup.xml`, 'utf-8'));
			if (!PLATE_NAME_GAME.includes(meta.MusicGroupData.name.str)) continue;
			const plateName = PLATE_NAME[PLATE_NAME_GAME.indexOf(meta.MusicGroupData.name.str)];
			console.log(aDir, plateName, meta.MusicGroupData.MusicIds.list.StringID.length);
			result[plateName] = meta.MusicGroupData.MusicIds.list.StringID.map((x: any) => x.id);
		}
	}
}

console.dir(result, { depth: null, maxArrayLength: null });
