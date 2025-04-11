import { Bot, BotTypes } from './Bot';
import { BundledMessageBase, DummyBundledMessage } from './BundledMessage';
import { BaseTextMessageAction } from './BaseTextMessageAction';

export abstract class SendMessageResult<T extends BotTypes> {
	protected constructor(
		public readonly messageId: T['MessageId']
	) {
	}

	public abstract delete(): Promise<void>;

	public abstract edit(): EditMessageAction<T>

	// 用于图片缓存
	public abstract fileId?: T['SendableFile'];
}

abstract class DispatchableMessageAction<T extends BotTypes> extends BaseTextMessageAction<T> {
	public abstract dispatch(): Promise<SendMessageResult<T>>;

	protected _replyToMessageId: T['MessageId'];

	public replyTo(messageId: T['MessageId']) {
		this._replyToMessageId = messageId;
		return this;
	}

	protected _disableLinkPreview = false;

	public disableLinkPreview() {
		this._disableLinkPreview = true;
		return this;
	}
}

export abstract class EditMessageAction<T extends BotTypes> extends DispatchableMessageAction<T> {
	protected _clearButtons = false;

	public clearButtons() {
		this._clearButtons = true;
		return this;
	}
}

export abstract class SendMessageAction<T extends BotTypes> extends DispatchableMessageAction<T> {
	protected constructor(
		bot: Bot<T>,
		public readonly chatId: T['ChatId']
	) {
		super(bot);
	}

	protected _file: T['SendableFile'] = null;
	protected _fileType: 'audio' | 'document' | 'photo' = null;
	protected _templatedMessage: TemplatedMessage<T> = null;
	protected _bundledMessage: BundledMessageBase<T> = null;
	protected _jsonMessage: string = null;

	public addPhoto(file: T['SendableFile']) {
		this._fileType = 'photo';
		this._file = file;
		return this;
	}

	public addAudio(file: T['SendableFile']) {
		this._fileType = 'audio';
		this._file = file;
		return this;
	}

	public addDocument(file: T['SendableFile']) {
		this._fileType = 'document';
		this._file = file;
		return this;
	}

	// 仅在 QQ 中支持
	public addBundledMessage() {
		this._bundledMessage = new DummyBundledMessage(this.bot);
		return this._bundledMessage;
	}

	// 仅在 QQ 中支持
	public setJsonMessage(json: string) {
		this._jsonMessage = json;
		return this;
	}

	// 仅在 QQ 官 Bot 中支持，弃用
	public setTemplatedMessage(template: T['MessageTemplateID'], values: Record<string, string>) {
		this._templatedMessage = new TemplatedMessage(template, values);
		return this;
	}

	// 防止 tg 压缩图片，qq 里应该不用理会
	public filesAsDocument() {
		this._fileType = 'document';
		return this;
	}
}

export interface MessageButton {
	text: string;
}

export class MessageButtonCallback implements MessageButton {
	constructor(
		public readonly text: string,
		public readonly callbackData: string
	) {
	}
}

export class MessageButtonSwitchInline implements MessageButton {
	constructor(
		public readonly text: string,
		public readonly callbackData: string
	) {
	}
}

export class MessageButtonSwitchInlineOtherChat extends MessageButtonSwitchInline {
}

export class MessageButtonUrl implements MessageButton {
	constructor(
		public readonly text: string,
		public readonly url: string
	) {
	}
}

export class TemplatedMessage<T extends BotTypes> {
	constructor(
		public readonly template: T['MessageTemplateID'],
		public readonly values: Record<string, string>
	) {
	}
}
