import {
	CommandBase,
	NCommandBase,
} from '../command-base';

export class CommandHelp extends CommandBase {
	static override base = 'help';
	static override alts = ['h'];
	override args: NCommandBase.IArg = {
		name: '',
		execute: () => {
			return {
				name: 'write',
				data: [
					[],
					[
						{
							type: 'text',
							value: 'Available commands:',
						},
					],
					[
						{
							type: 'text',
							value:
								'> help [h] - Display this help message',
						},
					],
					[
						{
							type: 'text',
							value:
								'> whoami [wai] - Generic information about me',
						},
					],
				],
			};
		},
	};
}
