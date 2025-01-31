import { LEVELS, Song, UserMusic, MaiVersion, Nameplate as NameplateData } from '@clansty/maibot-types';
import _ from 'lodash';
import styles from './LevelScores.module.css';
import { component$ } from '@builder.io/qwik';
import B50Song from '~/routes/b50/components/B50Song';
import Nameplate from '~/components/Nameplate';

export default component$(({ userMusic, level, logo, version, user }: { userMusic: UserMusic[], level: typeof LEVELS[number], logo: string, version: MaiVersion, user: NameplateData }) => {
	let rows = userMusic.map(it => {
		const song = Song.fromId(it.musicId, version);
		return {
			music: it,
			song,
			chart: song?.getChart(it.level)
		};
	});
	rows = rows.filter(it => it.chart?.level === level);
	rows = _.sortBy(rows, it => -it.music.achievement);
	rows = _.take(rows, 100);
	const disp = _.chunk(rows, 20);

	return <div>
		<div class={`${styles.header} flex items-center p-20px gap-50px`}>
			<div class="text-18px">
				<Nameplate user={user} />
			</div>
			<div class={`${styles.title} text-60px m-t--.1em text-shadow-[1px_1px_2px_#fff]`}>
				LV {level} 分数表
			</div>
			<div style={{ flexGrow: 1 }} class={styles.hideOnSmallScreen2} />
			<img src={logo} alt="" height={120} class={styles.hideOnSmallScreen} />
		</div>
		<div class="flex flex-col gap-50px p-x-20px">
			{disp.map(group => <div class="grid grid-cols-5 gap-x-5px">
				{group.map(it => <B50Song song={it.song!} score={it.music} entry={{
					level: it.music.level,
					achievement: it.music.achievement,
					musicId: it.music.musicId
				}} />)}
			</div>)}
		</div>
	</div>;
});
