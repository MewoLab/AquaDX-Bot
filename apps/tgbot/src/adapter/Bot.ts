import { Bot, BotTypes as BotTypesBase, CallbackQueryEventBase, CommandEventBase, InlineQueryEventBase, InlineQueryResultChosenEventBase, KeywordEventBase } from '@clansty/maibot-firm';
import { InputFile } from 'grammy';
import { InlineQueryResult } from 'grammy/types';
import { SendMessageAction } from './MessageAction';
import { Bot as GrammyBot } from 'grammy';
import { CommandEvent, KeywordEvent } from './MessageEvent';
import { CallbackQueryEvent } from './CallbackQuery';
import { InlineQueryEvent, InlineQueryResultChosenEvent } from './InlineQuery';

export interface BotTypes extends BotTypesBase<number, number, InputFile | string, InlineQueryResult> {
}

export class BotAdapter extends Bot<BotTypes> {
	public constructor(public readonly client: GrammyBot) {
		super();
	}

	public isMessageButtonsSupported = true;
	public isInlineQuerySupported = true;
	public isCallbackQuerySupported = true;
	public isHtmlMessageSupported = true;
	public isFileWithTextSupported = true;
	public isEditMessageSupported = true;

	public constructMessage(targetChat: number) {
		return new SendMessageAction(this, targetChat);
	}

	public registerCommand(command: string | string[], handler: (event: CommandEventBase<BotTypes>) => Promise<boolean>): void {
		this.client.command(command, async (ctx, next) => {
			const res = await handler(new CommandEvent(this, ctx));
			if (!res) {
				await next();
			}
		});
	}

	public registerKeyword(keyword: RegExp | RegExp[], handler: (event: KeywordEventBase<BotTypes>) => Promise<boolean>): void {
		this.client.hears(keyword, async (ctx, next) => {
			const res = await handler(new KeywordEvent(this, ctx));
			if (!res) {
				await next();
			}
		});
	}

	public registerCallbackQuery(data: RegExp | RegExp[], handler: (event: CallbackQueryEventBase<BotTypes>) => Promise<boolean>): void {
		this.client.callbackQuery(data, async (ctx, next) => {
			const res = await handler(new CallbackQueryEvent(this, ctx));
			if (!res) {
				await next();
			}
		});
	}

	public registerInlineQuery(query: RegExp | RegExp[], handler: (event: InlineQueryEventBase<BotTypes>) => Promise<boolean>): void {
		this.client.inlineQuery(query, async (ctx, next) => {
			const res = await handler(new InlineQueryEvent(this, ctx));
			if (!res) {
				await next();
			}
		});
	}

	public registerInlineQueryResultChosen(resultId: RegExp | RegExp[], handler: (event: InlineQueryResultChosenEventBase<BotTypes>) => Promise<boolean>): void {
		this.client.chosenInlineResult(resultId, async (ctx, next) => {
			const res = await handler(new InlineQueryResultChosenEvent(this, ctx));
			if (!res) {
				await next();
			}
		});
	}
	
	constructFile(file: Uint8Array, filename: string): BotTypes['SendableFile'] {
		return new InputFile(file, filename);
	}
}
