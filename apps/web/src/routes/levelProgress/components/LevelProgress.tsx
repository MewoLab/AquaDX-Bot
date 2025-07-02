import { LEVEL_EN, LEVELS, Song, VersionEnum, ProgressCalcResult, TableContentRenderData, TableContentRenderRow, UserMusic, Regions, MaiVersion } from '@clansty/maibot-types';
import TableContent from '../../../components/TableContent';
import _ from 'lodash';
import LevelProgress from '../../../components/LevelProgress';
import styles from './LevelProgress.module.css';
import { component$ } from '@builder.io/qwik';

export default component$(({ userMusic, level, region, requiredSongIdList, logo, version }: { userMusic: UserMusic[], level: typeof LEVELS[number], region: keyof Regions, requiredSongIdList: number[], logo: string, version: MaiVersion }) => {
	let displayData = [] as TableContentRenderData[];
	const requiredSongList = requiredSongIdList.map(id => Song.fromId(id, version)!);
	const progress = Array(5).fill(null).map(() => ({ all: 0, done: 0 })) as ProgressCalcResult[];
	// 用于计算是否全部 S 了之类的
	let userMaxScore = 101e4;
	for (const song of requiredSongList) {
		const charts = song.sheets.filter(chart => chart.level === level);
		for (const chart of charts) {
			// 不包括删除曲
			// if (!chart.regions[region]) continue;
			const score = userMusic.find(it => it.musicId === chart.internalId && it.level === LEVEL_EN.indexOf(chart.difficulty));
			progress[LEVEL_EN.indexOf(chart.difficulty)].all++;
			// TODO: 检查成绩，比如说 12 鸟加完成图
			if (score) {
				userMaxScore = Math.max(userMaxScore, score.achievement);
				progress[LEVEL_EN.indexOf(chart.difficulty)].done++;
			} else {
				userMaxScore = -1;
			}
			displayData.push({
				song,
				chart,
				score
			});
		}
	}
	const displayDataRows = _.orderBy(Object.entries(
		_.groupBy(displayData, it => it.chart.internalLevelValue.toFixed(1)))
		.map(([levelValue, data]) => ({
			levelValue,
			data
		} as TableContentRenderRow)), it => it.levelValue, 'desc');

	return <div>
		<div class={`${styles.header} flex items-center p-40px gap-50px`}>
			<img src={logo} alt="" height={120} class={styles.hideOnSmallScreen} />
			<div style={{ flexGrow: 1 }} class={styles.hideOnSmallScreen2} />
			<div class={`${styles.title} text-60px m-t--.1em text-shadow-[1px_1px_2px_#fff]`}>
				LV {level} {userMusic.length ? '完成进度' : '定数表'}
			</div>
			{!!userMusic.length && <LevelProgress progress={progress} />}
		</div>
		<TableContent data={displayDataRows} scoreType={'rank'} />
	</div>;
});
