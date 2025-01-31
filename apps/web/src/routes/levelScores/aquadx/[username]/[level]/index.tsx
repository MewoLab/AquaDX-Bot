import { LEVELS, Song } from '@clansty/maibot-types';
import { routeLoader$ } from '@builder.io/qwik-city';
import getAquaDxUser from '~/utils/getAquaDxUser';
import { component$ } from '@builder.io/qwik';
import LevelScores from '../../../components/LevelScores';

export const useData = routeLoader$(async ({ platform, params, error }) => {
	const level = decodeURIComponent(params.level) as typeof LEVELS[number];
	if (!LEVELS.includes(level)) {
		error(404, 'nya?');
	}

	const profile = await getAquaDxUser(params.username);
	const requiredSongList = Song.getByCondition(it => it.sheets.some(chart => chart.level === level)) as Song[];
	const userMusic = await profile.getUserMusic(requiredSongList);
	const versionLogo = await profile.getVersionLogo();
	const version = await profile.getVersion();
	const userData = await profile.getNameplate();

	return { requiredSongList: requiredSongList.map(it => it.dxId), userMusic, region: profile.region, level, versionLogo, version, userData };
});

export default component$(() => {
	const data = useData();

	return <LevelScores userMusic={data.value.userMusic} level={data.value.level} logo={data.value.versionLogo} version={data.value.version} user={data.value.userData} />;
});
