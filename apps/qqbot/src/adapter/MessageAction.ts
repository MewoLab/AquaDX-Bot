import { BundledMessageBase, SendMessageAction as SendMessageActionBase, SendMessageResult as SendMessageResultBase } from '@clansty/maibot-firm';
import { WSSendParam, WSSendReturn } from 'node-napcat-ts/dist/Interfaces';
import { BotAdapter, BotTypes } from './Bot';
import { NoReportError } from '@clansty/maibot-core';
import { BundledMessage } from './BundledMessage';

export class SendMessageResult extends SendMessageResultBase<BotTypes> {
	public constructor(protected bot: BotAdapter, protected data: WSSendReturn['send_msg']) {
		super(data.message_id);
	}

	public async delete(): Promise<void> {
		await this.bot.callApi('delete_msg', { message_id: this.data.message_id });
	}

	public edit(): never {
		throw new NoReportError('不支持编辑消息');
	}

	public get fileId() {
		return null;
	};
}

export class SendMessageAction extends SendMessageActionBase<BotTypes> {
	public constructor(protected bot: BotAdapter, chatId: BotTypes['ChatId']) {
		super(bot, chatId);
	}

	public override addBundledMessage(): BundledMessage {
		this._bundledMessage = new BundledMessage(this.bot);
		return this._bundledMessage as BundledMessage;
	}

	public async dispatch(): Promise<SendMessageResultBase<BotTypes>> {
		let params: WSSendParam['send_msg'];

		if (this.chatId < 0) {
			params = {
				group_id: -this.chatId,
				message: []
			};
		} else {
			params = {
				user_id: this.chatId,
				message: []
			};
		}

		if (this._replyToMessageId && !this._replyToMessageId) {
			params.message.push({
				type: 'reply',
				data: {
					id: this._replyToMessageId.toString()
				}
			});
		}

		switch (this._fileType) {
			case 'audio':
				throw new Error('应该不会发这玩意');
			case 'photo':
			// qq 不用考虑长图压缩
			case 'document':
				params.message.push({
					type: 'image',
					data: {
						file: this._file,
						name: '猫',
						summary: '猫'
					}
				});
				break;
		}

		if (this._jsonMessage) {
			params.message.push({
				type: 'json',
				data: {
					data: this._jsonMessage
				}
			});
		}
		if (this._text) {
			params.message.push({
				type: 'text',
				data: {
					text: this._text
				}
			});
		}

		if (this._bundledMessage) {
			// @ts-ignore
			params = {
				...params,
				...(this._bundledMessage as BundledMessage).compose()
			};
		}

		const ret = await this.bot.callApi('send_msg', params);
		return new SendMessageResult(this.bot, ret);
	}
}
