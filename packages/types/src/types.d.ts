import Song from './Song';
import { Sheet } from '@gekichumai/dxdata';
import { BA_VE, PLATE_VER } from './consts';
import { KVStorage } from './KVStorage';

export type UserMusic = {
	'musicId': number,
	'level': number,
	'playCount': number,
	'achievement': number,
	'comboStatus': number,
	'syncStatus': number,
	'deluxscoreMax': number,
	'scoreRank': number,
	'extNum1': number
}

export type UserMusicChuni = {
	musicId: number,
	level: number,
	playCount: number,
	scoreMax: number,
	missCount: number,
	maxComboCount: number,
	fullChain: number,
	maxChain: number,
	scoreRank: number,
	theoryCount: number,
	ext1: number,
	isFullCombo: boolean,
	isAllJustice: boolean,
	isSuccess: number,
	isLock: boolean
}

export type RatingListEntry = {
	'musicId': number,
	'level': number,
	'romVersion'?: number,
	'achievement': number
}

export type UserRating = {
	rating: number,
	ratingList: RatingListEntry[],
	newRatingList: RatingListEntry[]
}

export type UserCombinedRating = {
	best35: RatingListEntry[],
	best15: RatingListEntry[],
	musicList: UserMusic[]
}

export type UserCombinedRatingChuni = {
	best30: RatingListEntry[],
	recent10: RatingListEntry[],
	musicList: UserMusicChuni[]
}

export interface UserPreview extends UserPreviewSummary {
	'userId': number,
	'isLogin': boolean,
	'lastGameId': string,
	'lastDataVersion': string,
	'lastLoginDate': string,
	'lastPlayDate': string,
	'nameplateId': number,
	'iconId': number,
	'trophyId': number,
	'partnerId': number,
	'frameId': number,
	'totalAwake': number,
	'isNetMember': number,
	'dailyBonusDate': number,
	'headPhoneVolume': number,
	'dispRate': number,
	'isInherit': number,
	'banState': number
}

export interface UserPreviewSummary {
	'userName': string,
	'playerRating': number,
	lastRomVersion: string,
}

export type UserData = {
	accessCode: string;
	userName: string;
	friendCode: string;
	isNetMember: number;
	nameplateId: number;
	iconId: number;
	trophyId: number;
	plateId: number;
	titleId: number;
	partnerId: number;
	frameId: number;
	selectMapId: number;
	totalAwake: number;
	gradeRating: number;
	musicRating: number;
	playerRating: number;
	highestRating: number;
	gradeRank: number;
	classRank: number;
	courseRank: number;
	charaSlot: number[];
	charaLockSlot: number[];
	contentBit: number;
	playCount: number;
	eventWatchedDate: string;
	lastGameId: string;
	lastRomVersion: string;
	lastDataVersion: string;
	lastLoginDate: string;
	lastPlayDate: string;
	lastPlayCredit: number;
	lastPlayMode: number;
	lastPlaceId: number;
	lastPlaceName: string;
	lastAllNetId: number;
	lastRegionId: number;
	lastRegionName: string;
	lastClientId: string;
	lastCountryCode: string;
	lastSelectEMoney: number;
	lastSelectTicket: number;
	lastSelectCourse: number;
	lastCountCourse: number;
	firstGameId: string;
	firstRomVersion: string;
	firstDataVersion: string;
	firstPlayDate: string;
	compatibleCmVersion: string;
	dailyBonusDate: string;
	dailyCourseBonusDate: string;
	lastPairLoginDate: string;
	lastTrialPlayDate: string;
	playVsCount: number;
	playSyncCount: number;
	winCount: number;
	helpCount: number;
	comboCount: number;
	totalDeluxscore: number;
	totalBasicDeluxscore: number;
	totalAdvancedDeluxscore: number;
	totalExpertDeluxscore: number;
	totalMasterDeluxscore: number;
	totalReMasterDeluxscore: number;
	totalHiscore: number;
	totalBasicHighscore: number;
	totalAdvancedHighscore: number;
	totalExpertHighscore: number;
	totalMasterHighscore: number;
	totalReMasterHighscore: number;
	totalSync: number;
	totalBasicSync: number;
	totalAdvancedSync: number;
	totalExpertSync: number;
	totalMasterSync: number;
	totalReMasterSync: number;
	totalAchievement: number;
	totalBasicAchievement: number;
	totalAdvancedAchievement: number;
	totalExpertAchievement: number;
	totalMasterAchievement: number;
	totalReMasterAchievement: number;
	playerOldRating: number;
	playerNewRating: number;
	banState: number;
	dateTime: number;
	cmLastEmoneyBrand: number;
	cmLastEmoneyCredit: number;
	mapStock: number;
	currentPlayCount: number;
	renameCredit: number;
}

export type TableContentRenderData = {
	song: Song,
	chart: Sheet,
	score?: UserMusic
}

export type TableContentRenderRow = {
	// 定数
	levelValue: number | string,
	data: TableContentRenderData[]
}

export type ScoreRenderType = 'rank' | 'score' | 'combo'

export type Rank = 'sssp' | 'sss' | 'ssp' | 'ss' | 'sp' | 's' | 'aaa' | 'aa' | 'a' | 'bbb' | 'bb' | 'b' | 'c' | 'd'

export type ProgressCalcResult = { done: number, all: number }

export type Nameplate = {
	iconId: number,
	titleId: number,
	plateId: number,
	classRank: number,
	playerRating: number,
	userName: string,
	courseRank: number
}

export type UserProfileDtoAquaDx = {
	userId: number,
	type: 'AquaDX',
}

export type UserProfileDtoAquaDxV2 = {
	username: string,
	type: 'AquaDX-v2',
}

export type UserProfileDtoSdgb = {
	userId: number,
	type: 'SDGB',
}

export type UserProfileDtoSdga = {
	userId: number,
	aime: string,
	authKey: string,
	type: 'SDGA',
}

// TODO
export type UserProfileDtoAnyAqua = {
	userId: number,
	serverUrl: string,
	type: 'AnyAqua',
}

export type UserProfileDto = UserProfileDtoAquaDx | UserProfileDtoSdgb | UserProfileDtoAquaDxV2 | UserProfileDtoSdga

export type UserProfilesKVStorage = {
	profiles: UserProfileDto[],
	selected: number
}

export type GameVariantPlateMusicList = { [k in typeof PLATE_VER[number] | typeof BA_VE]: number[] }

export interface Env {
	KV: KVStorage;
	API_SECRET: string;
	POWERON_TOKEN: string;
	CF_ACCESS_CLIENT_ID: string;
	CF_ACCESS_CLIENT_SECRET: string;
}

export interface BotEnv extends Env {
	ADMIN_UIDS: string;
	ADMIN_SECRET: string;
	GENIUS_SECRET: string;
	TELEGRAPH_SECRET: string;
	DEEPL_AUTH_KEY: string;
}

export type MaiVersion = 140 | 145


