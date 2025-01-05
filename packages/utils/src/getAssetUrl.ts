export enum ASSET_TYPE {
	Base = 'Base',
	Frame = 'Frame',
	Icon = 'Icon',
	Jacket = 'Jacket',
	JacketPng = 'Jacket-PNG',
	ChuniJacket = 'Chu/Jacket',
	ChuniJacketPng = 'Chu/Jacket-PNG',
	Plate = 'Plate',
}

export const getAssetUrl = (type: ASSET_TYPE, id: number | string) => {
	switch (type) {
		case ASSET_TYPE.Icon:
			id = `UI_Icon_${id.toString().padStart(6, '0')}`;
			break;
		case ASSET_TYPE.Jacket:
		case ASSET_TYPE.JacketPng:
			id = id.toString().padStart(6, '0');
			break;
		case ASSET_TYPE.ChuniJacket:
		case ASSET_TYPE.ChuniJacketPng:
			id = id.toString().padStart(4, '0');
			break;
		case ASSET_TYPE.Plate:
			id = `UI_Plate_${id.toString().padStart(6, '0')}`;
			break;
		case ASSET_TYPE.Frame:
			id = `UI_Frame_${id.toString().padStart(6, '0')}`;
			break;
	}

	let ext = 'avif';
	if (type === ASSET_TYPE.JacketPng) ext = 'png';
	if (type === ASSET_TYPE.ChuniJacketPng) ext = 'png';

	return `https://maimai-assets.pages.dev/${type}/${id}.${ext}`;
};
