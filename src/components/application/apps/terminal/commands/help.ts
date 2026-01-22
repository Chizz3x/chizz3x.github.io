import {
	CommandBase,
	NCommandBase,
} from '../command-base';

export class CommandHelp extends CommandBase {
	static override base = 'help';
	static override alts = ['h'];
	/** Logic
	 * args is the root of the command
	 * it can have subcommands which branch out recursively
	 * additional non valid parameters are passed into the last execute that matches the command format
	 */
	override args: NCommandBase.IArg = {
		execute: () => {
			return {
				name: 'write',
				data: [
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
