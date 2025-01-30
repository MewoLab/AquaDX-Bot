import original from '../all-items.json';
import fsP from 'fs/promises';
import fs from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser();

for (const a of await fsP.readdir(path.join(process.argv[2]))) {
	if (!a.startsWith('A')) continue;
	const base = path.join(process.argv[2], a);
	if (fs.existsSync(path.join(base, 'title'))) {
		for (const dir of await fsP.readdir(path.join(base, 'title'))) {
			if (!fs.existsSync(path.join(base, 'title', dir, 'Title.xml'))) continue;
			const meta = parser.parse(await fsP.readFile(path.join(base, 'title', dir, 'Title.xml'), 'utf-8'));

			const id = meta.TitleData.name.id.toString();
			// console.log(meta.TitleData.name.str);
			const origin = original.title[id];
			if (origin) {
				origin.name = meta.TitleData.name.str.toString();
				origin.ver = meta.TitleData.releaseTagName.str.toString();
			} else {
				original.title[id] = {
					name: meta.TitleData.name.str.toString(),
					ver: meta.TitleData.releaseTagName.str.toString(),
					disable: "false",
				};
			}
		}
	}
	
	if (fs.existsSync(path.join(base, 'chara'))) {
		for (const dir of await fsP.readdir(path.join(base, 'chara'))) {
			if (!fs.existsSync(path.join(base, 'chara', dir, 'Chara.xml'))) continue;
			const meta = parser.parse(await fsP.readFile(path.join(base, 'chara', dir, 'Chara.xml'), 'utf-8'));

			const id = meta.CharaData.name.id.toString();
			const origin = original.chara[id];
			if (origin) {
				origin.name = meta.CharaData.name.str.toString();
			} else {
				original.chara[id] = {
					name: meta.CharaData.name.str.toString(),
					disable: "false",
				};
			}
		}
	}
	
	if (fs.existsSync(path.join(base, 'frame'))) {
		for (const dir of await fsP.readdir(path.join(base, 'frame'))) {
			if (!fs.existsSync(path.join(base, 'frame', dir, 'frame.xml'))) continue;
			const meta = parser.parse(await fsP.readFile(path.join(base, 'frame', dir, 'frame.xml'), 'utf-8'));

			const id = meta.FrameData.name.id.toString();
			const origin = original.frame[id];
			if (origin) {
				origin.name = meta.FrameData.name.str.toString();
			} else {
				original.frame[id] = {
					name: meta.FrameData.name.str.toString(),
					disable: "false",
				};
			}
		}
	}
	
	if (fs.existsSync(path.join(base, 'Icon'))) {
		for (const dir of await fsP.readdir(path.join(base, 'Icon'))) {
			if (!fs.existsSync(path.join(base, 'Icon', dir, 'Icon.xml'))) continue;
			const meta = parser.parse(await fsP.readFile(path.join(base, 'Icon', dir, 'Icon.xml'), 'utf-8'));

			const id = meta.IconData.name.id.toString();
			const origin = original.icon[id];
			if (origin) {
				origin.name = meta.IconData.name.str.toString();
			} else {
				original.icon[id] = {
					name: meta.IconData.name.str.toString(),
					disable: "false",
				};
			}
		}
	}
	
	if (fs.existsSync(path.join(base, 'Plate'))) {
		for (const dir of await fsP.readdir(path.join(base, 'Plate'))) {
			if (!fs.existsSync(path.join(base, 'Plate', dir, 'Plate.xml'))) continue;
			const meta = parser.parse(await fsP.readFile(path.join(base, 'Plate', dir, 'Plate.xml'), 'utf-8'));

			const id = meta.PlateData.name.id.toString();
			const origin = original.plate[id];
			if (origin) {
				origin.name = meta.PlateData.name.str.toString();
			} else {
				original.plate[id] = {
					name: meta.PlateData.name.str.toString(),
					disable: "false",
				};
			}
		}
	}
}

await fsP.writeFile('all-items-new.json', JSON.stringify(original, null, 2));
