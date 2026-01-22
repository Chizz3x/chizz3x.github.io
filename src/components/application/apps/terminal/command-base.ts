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
		context: NCommandBase.IExecuteProps,
	): NCommandBase.TAction | null {
		if (tokens.length === 0) {
			return argDef.execute(tokens, context);
		}

		const token = tokens[0];
		if (argDef.subArgs) {
			for (const subArg of argDef.subArgs) {
				if (
					subArg.name === token ||
					subArg.alts?.includes(token)
				) {
					return this.traverseArgs(
						subArg,
						tokens.slice(1),
						context,
					);
				}
			}
		}

		return argDef.execute(tokens, context);
	}

	execute(props: NCommandBase.IExecuteProps) {
		const tokens = CommandBase.parseArgStr(
			props.argStr,
		);
		return CommandBase.traverseArgs(
			this.args,
			tokens,
			props,
		);
	}
}

export namespace NCommandBase {
	export interface IArg {
		name?: string;
		alts?: string[];
		subArgs?: IArg[];
		execute: (
			args: string[],
			context: IExecuteProps,
		) => TAction | null;
	}
	export type TAction =
		| {
				name: 'clear';
		  }
		| {
				name: 'write';
				data: NTerminalApp.TPushData[][];
		  };

	export interface IExecuteProps {
		argStr: string;
		buffer: NTerminalApp.TCell[][];
	}
}
