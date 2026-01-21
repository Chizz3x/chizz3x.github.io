import { NTerminalApp } from '.';

export abstract class CommandBase {
	static base: string;
	static alts: string[];
	abstract args: NCommandBase.IArg;
	static ARG_REGEX =
		/--?[\w-]+(?:=(?:"[^"]*"|'[^']*'|[^\s]+))?|"(?:[^"]*)"|'(?:[^']*)'|[^\s]+/g;

	static parseArgStr(argStr: string): string[] {
		return argStr.match(this.ARG_REGEX) || [];
	}

	static traverseArgs(
		argDef: NCommandBase.IArg,
		tokens: string[],
	): NCommandBase.TAction | null {
		if (tokens.length === 0) {
			// No tokens left, call execute at current node
			return argDef.execute(tokens);
		}

		// Check if any subArg matches the first token
		const token = tokens[0];
		if (argDef.subArgs) {
			for (const subArg of argDef.subArgs) {
				if (
					subArg.name === token ||
					subArg.alts?.includes(token)
				) {
					// match found, recurse with remaining tokens
					return this.traverseArgs(
						subArg,
						tokens.slice(1),
					);
				}
			}
		}

		// No matching subArg: current node is the leaf
		return argDef.execute(tokens);
	}

	execute(argStr: string) {
		const tokens =
			CommandBase.parseArgStr(argStr);
		return CommandBase.traverseArgs(
			this.args,
			tokens,
		);
	}
}

export namespace NCommandBase {
	export interface IArg {
		name: string;
		alts?: string[];
		subArgs?: IArg[];
		execute: (args: string[]) => TAction | null;
	}
	export type TAction =
		| {
				name: 'clear';
		  }
		| {
				name: 'write';
				data: NTerminalApp.TPushData[][];
		  };
}
