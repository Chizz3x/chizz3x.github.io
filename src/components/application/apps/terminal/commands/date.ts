import { CommandBase, NCommandBase } from '../command-base';

export class CommandDate extends CommandBase {
  static override base = 'date';
  static override alts = ['time', 'now', 'dt'];
  override args: NCommandBase.IArg = {
    execute: () => {
      const now = new Date();
      return {
        name: 'write',
        data: [
          [
            {
              type: 'text',
              value: now.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short',
              }),
            },
          ],
        ],
      };
    },
  };
}
