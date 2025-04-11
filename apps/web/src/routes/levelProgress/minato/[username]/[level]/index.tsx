import LevelProgress from '../../../components/LevelProgress';
import { LEVELS, Song } from '@clansty/maibot-types';
import { routeLoader$ } from '@builder.io/qwik-city';
import getAquaDxUser from '~/utils/getAquaDxUser';
import { component$ } from '@builder.io/qwik';
import getMinatoUser from '~/utils/getMinatoUser';

export const useData = routeLoader$(async ({ platform, params, error }) => {
	const level = decodeURIComponent(params.level) as typeof LEVELS[number];
	if (!LEVELS.includes(level)) {
		error(404, 'nya?');
	}

	const profile = await getMinatoUser(params.username);
	const requiredSongList = Song.getByCondition(it => it.sheets.some(chart => chart.level === level));
	const userMusic = await profile.getUserMusic(requiredSongList);
	const versionLogo = await profile.getVersionLogo();
	const version = await profile.getVersion();

	return { requiredSongList: requiredSongList.map(it => it.dxId), userMusic, region: profile.region, level, versionLogo, version };
});

export default component$(() => {
	const data = useData();

	return <LevelProgress userMusic={data.value.userMusic} level={data.value.level} region={data.value.region}
		requiredSongIdList={data.value.requiredSongList} logo={data.value.versionLogo!} version={data.value.version} />;
});
