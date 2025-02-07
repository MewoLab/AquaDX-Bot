export const computeRa = (ds: number, achievement: number): number => {
	let baseRa: number = 22.4;
	if (achievement < 50e4) {
		baseRa = 0.0;
	} else if (achievement < 60e4) {
		baseRa = 8.0;
	} else if (achievement < 70e4) {
		baseRa = 9.6;
	} else if (achievement < 75e4) {
		baseRa = 11.2;
	} else if (achievement < 80e4) {
		baseRa = 12.0;
	} else if (achievement < 90e4) {
		baseRa = 13.6;
	} else if (achievement < 94e4) {
		baseRa = 15.2;
	} else if (achievement < 97e4) {
		baseRa = 16.8;
	} else if (achievement < 98e4) {
		baseRa = 20.0;
	} else if (achievement < 99e4) {
		baseRa = 20.3;
	} else if (achievement < 995e3) {
		baseRa = 20.8;
	} else if (achievement < 1e6) {
		baseRa = 21.1;
	} else if (achievement < 1005e3) {
		baseRa = 21.6;
	}
	return Math.floor(ds * (Math.min(100.5, achievement / 1e4) / 100) * baseRa);
};

function _chusanRating(lv: number, score: number) {
	lv = lv * 100;
	if (score >= 1009000) return lv + 215; // SSS+
	if (score >= 1007500) return lv + 200 + (score - 1007500) / 100; // SSS
	if (score >= 1005000) return lv + 150 + (score - 1005000) / 50; // SS+
	if (score >= 1000000) return lv + 100 + (score - 1000000) / 100; // SS
	if (score >= 975000) return lv + (score - 975000) / 250; // S+, S
	if (score >= 925000) return lv - 300 + (score - 925000) * 3 / 500; // AA
	if (score >= 900000) return lv - 500 + (score - 900000) * 4 / 500; // A
	if (score >= 800000) return ((lv - 500) / 2 + (score - 800000) * ((lv - 500) / 2) / (100000)); // BBB
	return 0; // C
}

export function chusanRating(lv: number, score: number) {
	let original = _chusanRating(lv, score);
	original = Math.floor(original);
	return original / 100;
}
