import type { IExecuteFunctions, ILoadOptionsFunctions, INodePropertyOptions, JsonObject, IHttpRequestOptions } from 'n8n-workflow';

import { INodeExecutionData, INodeType, INodeTypeDescription, NodeApiError } from 'n8n-workflow';

export class Pushinator implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Pushinator',
		name: 'pushinator',
		group: ['output'],
		version: 1,
		description: 'Send notifications using Pushinator',
		defaults: { name: 'Pushinator' },
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Send Notification',
						value: 'send_notification',
						action: 'Send a push notification',
					},
				],
				default: 'send_notification',
			},
			{
				displayName: 'Channel Name or ID',
				name: 'channel_id',
				type: 'options',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'fetchChannels'
				},
				default: '',
			},
			{
				displayName: 'Notification',
				name: 'notification',
				type: 'string',
				default: '',
			},
		],

		icon: 'file:pushinator.svg',
		credentials: [
			{
				name: 'pushinatorApi',
				required: true,
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const notification = this.getNodeParameter('notification', 0) as string;
		const channel_id = this.getNodeParameter('channel_id', 0) as string;

		try {
			const options: IHttpRequestOptions = {
				method: 'POST',
				url: 'https://api.pushinator.com/api/v2/notifications/send',
				headers: {
					'User-Agent': 'pushinator-n8n/1.0',
				},
				body: {
					channel_id: channel_id,
					content: notification,
				},
				json: true,
			};

			const response = await this.helpers.httpRequestWithAuthentication.call(this, 'pushinatorApi', options);
			return [this.helpers.returnJsonArray(response)];
		} catch (error) {
			if (this.continueOnFail()) {
				return [
					this.helpers.returnJsonArray({
						error: (error as Error).message,
					}),
				];
			}

			throw new NodeApiError(this.getNode(), error as JsonObject);
		}
	}

	methods = {
		loadOptions: {
			async fetchChannels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const options: IHttpRequestOptions = {
						url: 'https://api.pushinator.com/api/v2/channels',
						method: 'GET',
						json: true,
						headers: {
							'Content-Type': 'application/json',
							'User-Agent': 'pushinator-n8n/1.0',
						},
					};

					const response = await this.helpers.httpRequestWithAuthentication.call(this, 'pushinatorApi', options);

					return response.data.map((channel: any) => ({
						name: channel.name,
						value: channel.id,
					}));
				} catch(error) {
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}

			}
		}
	}

}
