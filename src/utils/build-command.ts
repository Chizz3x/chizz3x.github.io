import { CommandBase } from '../components/application/apps/terminal/command-base';

export default (
	Class: typeof CommandBase,
	command: CommandBase,
): [string, CommandBase][] => {
	return [
		[Class.base, command],
		...Class.alts.map<[string, CommandBase]>(
			(alt) => [alt, command],
		),
	];
};
