import { CommandBase, NCommandBase } from '../command-base';

export class CommandOpen extends CommandBase {
  static override base = 'open';
  static override alts: string[] = [];
  override args: NCommandBase.IArg = {
    execute: (args: string[], _context: NCommandBase.IExecuteProps) => {
      const aid = args[0];
      if (!aid) {
        return {
          name: 'write',
          data: [
            [
              {
                type: 'text' as const,
                value: 'Usage: open <app-id>',
                color: 'yellow',
              },
            ],
          ],
        };
      }

      return {
        name: 'open',
        aid,
      };
    },
  };
}
