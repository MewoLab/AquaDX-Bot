import original from '../../web/src/data/titles.json';
import fsP from 'fs/promises';
import fs from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser();

for (const a of await fsP.readdir(path.join(process.argv[2]))) {
	if (!a.startsWith('A')) continue;
	const base = path.join(process.argv[2], a);
	if (!fs.existsSync(path.join(base, 'title'))) continue;
	for (const dir of await fsP.readdir(path.join(base, 'title'))) {
		if (!fs.existsSync(path.join(base, 'title', dir, 'Title.xml'))) continue;
		const meta = parser.parse(await fsP.readFile(path.join(base, 'title', dir, 'Title.xml'), 'utf-8'));

		const id = meta.TitleData.dataName.substring(5);
		// console.log(meta.TitleData.name.str);
		const origin = original.find((t) => t.id === id);
		if (origin) {
			origin.name = meta.TitleData.name.str.toString();
			origin.rare = meta.TitleData.rareType;
		} else {
			original.push({
				id,
				name: meta.TitleData.name.str.toString(),
				rare: meta.TitleData.rareType
			});
		}
	}
}

await fsP.writeFile('../web/src/data/titles.json', JSON.stringify(original, null, 2));
