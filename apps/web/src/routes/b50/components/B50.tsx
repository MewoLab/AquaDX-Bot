import { RatingListEntry, UserMusic, Song, Nameplate as NameplateData, UserCombinedRating, MaiVersion, BUDDIES_PLUS_LOGO, BUDDIES_LOGO, Chart, PRISM_LOGO } from '@clansty/maibot-types';
import B50Song from './B50Song';
import { computeRa, ratingAnalyse } from '@clansty/maibot-utils';
import styles from './B50.module.css';
import Nameplate from '~/components/Nameplate';
import { component$ } from '@builder.io/qwik';

const getLogoByVersion = (ver: MaiVersion) => {
	switch (ver) {
		case 150: return PRISM_LOGO;
		case 145: return BUDDIES_PLUS_LOGO;
		case 140: return BUDDIES_LOGO;
		default: return BUDDIES_LOGO;
	}
};

export default component$(({ rating, user, ver }: { rating: UserCombinedRating, user: NameplateData, ver: MaiVersion }) =>
	<div style={{ padding: '0 20px' }}>
		<div class={`${styles.b50Header} flex items-center p-[20px_0] gap-[10px_40px]`}>
			<div class="text-1.8em">
				<Nameplate user={user} />
			</div>
			<div class={`${styles.hideOnSmallScreen} grow`} />
			<img class={styles.hideOnSmallScreen} src={getLogoByVersion(ver)} alt="" height={120} />
		</div>

		<RatingTable rating={rating.best35} userMusic={rating.musicList} title="旧版本 Best 35" ver={ver} />
		<RatingTable rating={rating.best15} userMusic={rating.musicList} title="当前版本 Best 15" ver={ver} />
	</div>);

const RatingTable = component$(({ rating, userMusic, title, ver }: { rating: RatingListEntry[], userMusic: UserMusic[], title: string, ver: MaiVersion }) => {
	const scores = [] as number[];
	let entries = [] as { rating: RatingListEntry, score?: number, song?: Song, chart?: Chart }[];
	for (const ratingListEntry of rating) {
		const song = Song.fromId(ratingListEntry.musicId, ver)!;
		const chart = song?.getChart(ratingListEntry.level);
		if (!chart) {
			entries.push({ rating: ratingListEntry });
			continue;
		}
		const score = computeRa(chart.internalLevelValue, ratingListEntry.achievement);
		scores.push(score);
		entries.push({ rating: ratingListEntry, score, song, chart });
	}
	// 游戏给的排序没问题。要是顺序真的不对，那就是算法有问题，或者是数据有问题。
	// entries = _.sortBy(entries, it => -it.score || 1);
	const averageMinMax = scores.reduce((acc, cur) => [acc[0] + cur, Math.min(acc[1], cur), Math.max(acc[2], cur)], [0, Infinity, -Infinity]);
	const sum = averageMinMax[0];
	averageMinMax[0] = Math.round(sum / scores.length);

	return <div>
		<div class={styles.b50GridHeader} style={{ display: 'flex', alignItems: 'center', textShadow: '1px 1px 2px #fff', fontWeight: 500 }}>
			<div style={{ fontSize: '5em', flexGrow: 1 }}>
				{title}
				<div class="text-.4em">
					总分: <span class="font-600">{sum}</span>
					{![35, 15].includes(scores.length) && `（共 ${scores.length} 首）`}
				</div>
			</div>
			<div style={{ fontSize: '2em', margin: '0 15px' }}>
				<div>平均: {ratingAnalyse(averageMinMax[0])}</div>
				<div>最低: {ratingAnalyse(averageMinMax[1])}</div>
				<div>最高: {ratingAnalyse(averageMinMax[2])}</div>
			</div>
		</div>
		<div class={styles.b50Grid}>
			{entries.map(it => <B50Song entry={it.rating} song={it.song!} score={userMusic.find(music => music.musicId === it.rating.musicId && music.level === it.rating.level)!} key={it.rating.musicId} />)}
		</div>
	</div>;
});
