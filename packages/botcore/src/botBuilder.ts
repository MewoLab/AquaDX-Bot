import { Bot, BotTypes, EventBase } from '@clansty/maibot-firm';
import { BotEnv } from '@clansty/maibot-types';
import UserContext from './UserContext';
import callbackQuery from './modules/callbackQuery';
import help from './modules/help';
import bind from './modules/bind';
import scoreQuery from './modules/scoreQuery';
import plateProgress from './modules/plateProgress';
import levelProgress from './modules/levelProgress';
import b50 from './modules/b50';
import musicSearch from './modules/musicSearch';
import admin from './modules/admin';

interface BuilderEnvBase<T extends BotTypes> {
	bot: Bot<T>,
	env: BotEnv,
	genImage: (url: string, width: number) => Promise<{ data: T['SendableFile'], height: number }>,
	musicToFile: Record<string | number, string>,
	enableOfficialServers: boolean,
}

export interface BuilderEnv<T extends BotTypes> extends BuilderEnvBase<T> {
	getContext: (e: EventBase<T>) => UserContext<T>,
}

export const buildBot = <T extends BotTypes>(env: BuilderEnvBase<T>) => {
	const passEnv = {
		...env,
		getContext: (event: EventBase<T>) => new UserContext(
			env.env,
			event.fromId,
			() => 'reply' in event ? (event.reply as any)() : env.bot.constructMessage('chatId' in event ? event.chatId as any : event.fromId),
			env.genImage
		)
	} satisfies BuilderEnv<T>;

	for (const attachHandlers of [callbackQuery, help, bind, scoreQuery, plateProgress, levelProgress, /* levelConstTable, */ b50, musicSearch, admin]) {
		attachHandlers(passEnv);
	}
};
