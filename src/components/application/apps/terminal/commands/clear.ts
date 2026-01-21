import {
	CommandBase,
	NCommandBase,
} from '../command-base';

export class CommandClear extends CommandBase {
	static override base = 'clear';
	static override alts = ['cl', 'clr'];
	override args: NCommandBase.IArg = {
		name: '',
		execute: () => {
			return {
				name: 'clear',
			};
		},
	};
}
