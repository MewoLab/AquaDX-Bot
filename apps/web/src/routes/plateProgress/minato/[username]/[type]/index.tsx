import { BA_VE, PLATE_TYPE, PLATE_VER, Song } from '@clansty/maibot-types';
import { routeLoader$ } from '@builder.io/qwik-city';
import getAquaDxUser from '~/utils/getAquaDxUser';
import { component$ } from '@builder.io/qwik';
import PlateProgress from '~/routes/plateProgress/components/PlateProgress';
import getMinatoUser from '~/utils/getMinatoUser';

export const useData = routeLoader$(async ({ platform, params, error }) => {
	let type = decodeURIComponent(params.type) as typeof PLATE_TYPE[number] | '';
	let ver: typeof PLATE_VER[number] | typeof BA_VE;
	if (type as any === BA_VE) {
		ver = BA_VE;
		type = '';
	} else {
		ver = type.substring(0, 1) as any;
		type = type.substring(1) as any;
		if (!(PLATE_VER.includes(ver as any) && PLATE_TYPE.includes(type as any)))
			error(404, 'nya?');
	}

	const profile = await getMinatoUser(params.username);
	const profileVer = await profile.getVersion();
	// @ts-ignore
	const requiredList = (await profile.plateSongs())[ver].map(it => Song.fromId(it, profileVer)) as Song[];
	const userMusic = await profile.getUserMusic(requiredList);
	const versionLogo = await profile.getVersionLogo();
	const version = await profile.getVersion();

	return { requiredSongList: requiredList.map(it => it.dxId), userMusic, region: profile.region, type, ver, versionLogo, version };
});

export default component$(() => {
	const data = useData();

	return <PlateProgress userMusic={data.value.userMusic} type={data.value.type} ver={data.value.ver}
		requiredList={data.value.requiredSongList.map(id => Song.fromId(id, data.value.version)!)} logo={data.value.versionLogo!} />;
});
