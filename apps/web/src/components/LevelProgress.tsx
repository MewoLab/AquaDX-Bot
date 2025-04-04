import { ProgressCalcResult } from '@clansty/maibot-types';
import DifficultyTag from './DifficultyTag';
import ProgressBar from './ProgressBar';
import { LEVEL_COLOR } from '@clansty/maibot-types';

export default ({ progress }: { progress: ProgressCalcResult[] }) =>
	<div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
		{progress.slice(0, 5)
			.map((it, i) => [it, i] as [ProgressCalcResult, number])
			.filter(([it, i]) => it.all > 0)
			.map(([it, i]) =>
				<div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 250px auto', gap: 10, alignItems: 'center', fontWeight: 600 }}>
					<DifficultyTag level={i} />
					<ProgressBar color={LEVEL_COLOR[i]} progress={it.done / it.all} />
					<div style={{ marginTop: '-.1em', fontSize: 22 }}>{it.done}/{it.all}</div>
				</div>)}
	</div>;
