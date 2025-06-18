import type { IExecuteFunctions, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

import { INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';

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
		const credentials = await this.getCredentials('pushinatorApi');

		const notification = this.getNodeParameter('notification', 0) as string;
		const channel_id = this.getNodeParameter('channel_id', 0) as string;

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.pushinator.com/api/v2/notifications/send',
			headers: {
				Authorization: `Bearer ${credentials.apiKey}`,
				'User-Agent': 'pushinator-n8n/1.0',
			},
			body: {
				channel_id: channel_id,
				content: notification,
			},
			json: true,
		});

		return [this.helpers.returnJsonArray(response)];
	}


	methods = {
		loadOptions: {
			async fetchChannels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('pushinatorApi');

				const response = await this.helpers.request({
					url: 'https://api.pushinator.com/api/v2/channels',
					method: 'GET',
					json: true,
					headers: {
						'Content-Type': 'application/json',
						'User-Agent': 'pushinator-n8n/1.0',
						'Authorization': `Bearer ${credentials.apiKey}`
					},
				});

				return response.data.map((channel: any) => ({
					name: channel.name,
					value: channel.id,
				}));
			}
		}
	}

}
