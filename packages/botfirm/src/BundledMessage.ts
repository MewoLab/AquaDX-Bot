import { Bot, BotTypes } from './Bot';
import { BaseTextMessageAction } from './BaseTextMessageAction';

export abstract class BundledMessageBase<T extends BotTypes> {
	protected _title?: string;
	protected _description?: string;
	protected _summary?: string;
	protected _prompt?: string;

	public abstract addNode(): BundledMessageNodeBase<T>;

	public setTitle(title: string) {
		this._title = title;
		return this;
	}

	public setDescription(description: string) {
		this._description = description;
		return this;
	}

	public setSummary(summary: string) {
		this._summary = summary;
		return this;
	}

	public setPrompt(prompt: string) {
		this._prompt = prompt;
		return this;
	}
}

export abstract class BundledMessageNodeBase<T extends BotTypes> extends BaseTextMessageAction<T> {
	protected _file: T['SendableFile'] = null;
	protected _fileType: 'audio' | 'document' | 'photo' = null;
	protected _bundledMessage: BundledMessageBase<T> = null;
	protected _markdown: string = null;

	public addPhoto(file: T['SendableFile']) {
		this._fileType = 'photo';
		this._file = file;
		return this;
	}

	public setQQMarkdown(text: string) {
		this._markdown = text;
	}

	public abstract addBundledMessage(): BundledMessageBase<T>;
}

export class DummyBundledMessage<T extends BotTypes> extends BundledMessageBase<T> {
	public constructor(protected bot: Bot<T>) {
		super();
	}

	public addNode() {
		return new DummyBundledMessageNode<T>(this.bot);
	}
}

export class DummyBundledMessageNode<T extends BotTypes> extends BundledMessageNodeBase<T> {
	public constructor(bot: Bot<T>) {
		super(bot);
	}

	public dispatch() {
		return Promise.resolve({} as any);
	}

	public addBundledMessage() {
		this._bundledMessage = new DummyBundledMessage(this.bot);
		return this._bundledMessage;
	}
}
