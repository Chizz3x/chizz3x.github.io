import { CommandBase, NCommandBase } from '../command-base';

export class CommandCalc extends CommandBase {
  static override base = 'calc';
  static override alts = ['math', 'eval'];
  override args: NCommandBase.IArg = {
    execute: (args) => {
      const expr = args.join(' ');
      if (!expr) {
        return {
          name: 'write',
          data: [
            [
              {
                type: 'text',
                value: 'Usage: calc <expression>',
                color: 'orange',
              },
            ],
            [
              {
                type: 'text',
                value: 'Example: calc 2 + 2 * 3',
                color: 'gray',
              },
            ],
          ],
        };
      }

      try {
        // eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval
        const result = new Function(`"use strict"; return (${expr})`)();
        if (typeof result !== 'number' || !Number.isFinite(result)) {
          throw new Error('Invalid result');
        }
        return {
          name: 'write',
          data: [
            [
              {
                type: 'text',
                value: `${expr} = ${result}`,
                color: 'lime',
              },
            ],
          ],
        };
      } catch {
        return {
          name: 'write',
          data: [
            [
              {
                type: 'text',
                value: 'Error: invalid expression',
                color: 'red',
              },
            ],
          ],
        };
      }
    },
  };
}
