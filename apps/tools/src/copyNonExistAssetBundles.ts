import fsP from 'fs/promises';
import path from 'node:path';
import fs from 'fs';

const assets = 'Y:\\maimai\\mai-assets';
const pkg = 'E:\\Syncthing\\sdga1.45\\Package\\Sinmai_Data\\StreamingAssets';

const existedIds = {} as Record<string, number[]>;

for (const type of ['Frame', 'Icon', 'Jacket', 'Plate']) {
	await fsP.mkdir(type, { recursive: true });
	existedIds[type] = [];
	for (const x of await fsP.readdir(path.join(assets, type))) {
		if (!/\d{6}/.test(x)) continue;
		const id = /(\d{6})/.exec(x)![0];
		existedIds[type].push(+id);
	}
}

for (const a of await fsP.readdir(pkg)) {
	if (!a.startsWith('A')) continue;
	const abi = path.join(pkg, a, 'AssetBundleImages');
	if (!fs.existsSync(abi)) continue;

	for (const type of ['Frame', 'Icon', 'Jacket', 'Plate']) {
		let t = type;
		if (type === 'Plate') t = 'nameplate';
		const dir = path.join(abi, t);
		if (!fs.existsSync(dir)) continue;

		for (const x of await fsP.readdir(dir)) {
			if (!/(\d{6})/.test(x)) continue;
			const id = /(\d{6})/.exec(x)![0];
			if (!existedIds[type].includes(+id)) {
				console.log(`Copy ${a}/${type}/${x}`);
				fs.copyFileSync(path.join(dir, x), path.join(type, x), fs.constants.COPYFILE_FICLONE);
			}
		}
	}
}
