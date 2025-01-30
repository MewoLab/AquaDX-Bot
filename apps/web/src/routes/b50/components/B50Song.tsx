import { IMG_DX, IMG_MOON_CAKE, IMG_SONG_MISSING, IMG_STD, LEVEL_COLOR, Rank, RatingListEntry, Song, UserMusic } from '@clansty/maibot-types';
import { achievementToRank, computeRa } from '@clansty/maibot-utils';
import Digit from '~/components/Digit';
import { component$ } from '@builder.io/qwik';
import { ASSET_TYPE, getAssetUrl } from '@clansty/maibot-utils/src/getAssetUrl';

const getRankImage = (rank: Rank): string => {
	return getAssetUrl(ASSET_TYPE.Base, `UI_TTR_Rank_${rank.toUpperCase().replace('P', 'p')}`);
};

const BORDER_SIZE = 3;
const SIZE = 90;

export default ({ entry, score, song }: { entry: RatingListEntry, score: UserMusic, song: Song }) => {
	const href = song && `https://t.me/aquadxbot?start=song-${song.id}`;

	return href ? <a href={href}><Component entry={entry} score={score} song={song} /></a> : <Component entry={entry} score={score} song={song} />;
};

const Component = ({ entry, score, song }: { entry: RatingListEntry, score: UserMusic, song?: Song }) => {
	const chart = song?.getChart(entry.level);

	return <div style={{
		display: 'flex', borderWidth: BORDER_SIZE, borderStyle: 'solid', boxSizing: 'content-box', height: SIZE, marginTop: 5,
		borderColor: LEVEL_COLOR[entry.level], backgroundColor: LEVEL_COLOR[entry.level], fontWeight: 500, color: 'rgb(48, 49, 51)'
	}}>
		<div style={{
			width: SIZE, height: SIZE, borderRightStyle: 'solid', borderRightWidth: BORDER_SIZE, boxSizing: 'content-box',
			borderRightColor: LEVEL_COLOR[entry.level], backgroundColor: 'rgba(255, 255, 255, 0.85)'
		}}>
			<img src={song?.coverAvif || IMG_SONG_MISSING} alt="" width={SIZE} height={SIZE} style={{ objectFit: 'cover' }} />
		</div>
		<div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, boxSizing: 'border-box' }}>
			<div style={{
				backgroundColor: 'rgba(255, 255, 255, 0.7)', padding: '0 5px', display: 'flex', justifyContent: 'left', alignItems: 'center', height: 30, gap: 5,
				borderBottomStyle: 'solid', borderBottomWidth: BORDER_SIZE, borderBottomColor: LEVEL_COLOR[entry.level]
			}}>
				{/* 兼容如月车站 */}
				<div style={{ flexGrow: 1, width: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
					{song?.title === undefined ? '未知曲目: ' + entry.musicId : song.title}
				</div>
				{song && <img src={song?.dx ? IMG_DX : IMG_STD} alt="" height={24} style={{ marginBottom: -1 }} />}
			</div>
			<div style={{ flexGrow: 1, backgroundColor: 'rgba(255, 255, 255, 0.8)', display: 'flex', justifyContent: 'left', alignItems: 'center', padding: '0 5px' }}>
				<div style={{ flexGrow: 1 }}>
					<ScoreDisplay score={entry.achievement} />
					{chart && chart.internalLevelValue && <div>
						{chart.internalLevelValue.toFixed(1)}
						<span style={{ margin: '0 .3em' }}>→</span>
						<span style={{ fontWeight: 700 }}>{computeRa(chart.internalLevelValue, entry.achievement)}</span>
					</div>}
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
					<img src={getRankImage(achievementToRank(entry.achievement))} alt="" height={30} />
					{IMG_MOON_CAKE[score.comboStatus] && <img src={IMG_MOON_CAKE[score.comboStatus]} alt="" height={25} style={{ imageRendering: 'pixelated' }} />}
				</div>
			</div>
		</div>
	</div>;
};

const ScoreDisplay = component$(({ score }: { score: number }) => {
	const color = score >= 97e4 ? 'gold' : 'red';

	return <div style={{ display: 'flex', alignItems: 'flex-end	' }}>
		{Math.floor(score / 1e4).toString().split('').map((digit, index) =>
			<Digit digit={digit as any} key={index} color={color} width={25} />)}
		<Digit digit="." color={color} width={20} />
		{(score % 1e4).toString().padStart(4, '0').split('').map((digit, index) =>
			<Digit digit={digit as any} key={index} color={color} width={20} />)}
		<Digit digit="%" color={color} width={20} />
	</div>;
});
