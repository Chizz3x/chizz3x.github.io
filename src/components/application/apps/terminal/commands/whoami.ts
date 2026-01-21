import {
	CommandBase,
	NCommandBase,
} from '../command-base';

export class CommandWhoAmI extends CommandBase {
	static override base = 'whoami';
	static override alts = ['wai'];
	override args: NCommandBase.IArg = {
		name: '',
		subArgs: [
			{
				name: 'name',
				alts: ['n'],
				subArgs: [],
				execute: () => {
					return {
						name: 'write',
						data: [
							[],
							[
								{
									type: 'text',
									value: 'Chizz3x',
								},
							],
						],
					};
				},
			},
		],
		execute: () => {
			return {
				name: 'write',
				data: [
					[],
					[
						{
							type: 'text',
							value: 'Hi, I am Chizz3x',
						},
					],
					[
						{
							type: 'text',
							value:
								'Web, Automation and AI developer',
						},
					],
				],
			};
		},
	};
}
