import allMusic from './all-music.json';
import allMusic150 from './all-music-150.json';
import allMusic145 from './all-music-145.json';
import allMusic140 from './all-music-140.json';
import chuAllMusic from './chu-all-music.json';
import jacketExistIds from './jacket-exist-ids.json';
import chuJacketExistIds from './chu-jacket-exist-ids.json';

export const ALL_MUSIC = allMusic as Record<string | number, Partial<typeof allMusic[8]>>;
export const ALL_MUSIC_150 = allMusic150 as Record<string | number, Partial<typeof allMusic[8]>>;
export const ALL_MUSIC_145 = allMusic145 as Record<string | number, Partial<typeof allMusic[8]>>;
export const ALL_MUSIC_140 = allMusic140 as Record<string | number, Partial<typeof allMusic[8]>>;
export const CHU_ALL_MUSIC = chuAllMusic as Record<string | number, Partial<typeof chuAllMusic[68]>>;
export const JACKET_EXIST_IDS = jacketExistIds as number[];
export const CHU_JACKET_EXIST_IDS = chuJacketExistIds as number[];
