import { CommandBase, NCommandBase } from '../command-base';

export class CommandEcho extends CommandBase {
  static override base = 'echo';
  static override alts: string[] = [];
  override args: NCommandBase.IArg = {
    execute: (args) => {
      const text = args.join(' ') || '';
      return {
        name: 'write',
        data: [
          [
            {
              type: 'text',
              value: text,
            },
          ],
        ],
      };
    },
  };
}
