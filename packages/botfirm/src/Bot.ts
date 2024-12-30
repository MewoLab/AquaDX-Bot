import { SendMessageAction } from './MessageAction';
import { CommandEventBase, KeywordEventBase } from './MessageEvent';
import { CallbackQueryEventBase } from './CallbackQuery';
import { InlineQueryEventBase, InlineQueryResultChosenEventBase } from './InlineQuery';

export interface BotTypes<TChatId = unknown, TMessageId = unknown, TSendableFile = unknown, TInlineQueryAnswer = unknown, TMessageTemplateID = unknown> {
	ChatId: TChatId;
	MessageId: TMessageId;
	SendableFile: TSendableFile;
	InlineQueryAnswer: TInlineQueryAnswer;
	MessageTemplateID: TMessageTemplateID;
}

export abstract class EventBase<T extends BotTypes> {
	public fromId: T['ChatId'];
}

export abstract class Bot<T extends BotTypes> {
	public abstract readonly isMessageButtonsSupported: boolean;
	public abstract readonly isInlineQuerySupported: boolean;
	public abstract readonly isCallbackQuerySupported: boolean;
	public abstract readonly isHtmlMessageSupported: boolean;
	public abstract readonly isFileWithTextSupported: boolean;
	public abstract readonly isEditMessageSupported: boolean;

	public abstract constructMessage(targetChat: T['ChatId']): SendMessageAction<T>;

	// 因为 grammy 有处理消息中间件队列的能力，所以这里只要注册的方法，中间件队列处理交给上层。QQ 那边就自己实现一个
	// 这里的 boolean 返回 true 阻止后续处理，grammy 那里要写一个 wrapper 转换成 next()
	public abstract registerCommand(command: string | string[], handler: (event: CommandEventBase<T>) => Promise<boolean>): void;

	public abstract registerKeyword(keyword: RegExp | RegExp[], handler: (event: KeywordEventBase<T>) => Promise<boolean>): void;

	public abstract registerCallbackQuery(data: RegExp | RegExp[], handler: (event: CallbackQueryEventBase<T>) => Promise<boolean>): void;

	public abstract registerInlineQuery(query: RegExp | RegExp[], handler: (event: InlineQueryEventBase<T>) => Promise<boolean>): void;

	public abstract registerInlineQueryResultChosen(resultId: RegExp | RegExp[], handler: (event: InlineQueryResultChosenEventBase<T>) => Promise<boolean>): void;

	public constructFile(file: Uint8Array, filename: string): T['SendableFile'] {
		throw new Error('不支持此平台');
	}
}
