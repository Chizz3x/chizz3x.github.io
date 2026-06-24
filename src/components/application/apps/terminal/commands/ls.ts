import { CommandBase, NCommandBase } from '../command-base';
import { getNotepadFilenames } from '../../../notepad-registry';

export class CommandLs extends CommandBase {
  static override base = 'ls';
  static override alts: string[] = [];
  override args: NCommandBase.IArg = {
    subArgs: [
      {
        name: 'la',
        alts: ['-la', '-l', '-a'],
        execute: () => {
          const files = getNotepadFilenames();
          if (files.length === 0) {
            return {
              name: 'write',
              data: [
                [{ type: 'text' as const, value: 'total 0', color: 'gray' }],
              ],
            };
          }
          return {
            name: 'write',
            data: [
              [
                {
                  type: 'text' as const,
                  value: `total ${files.length}`,
                  color: 'gray',
                },
              ],
              ...files.map((name) => [
                {
                  type: 'text' as const,
                  value: `-rw-r--r--  1 chizz3x chizz3x  0  Jun 24 13:37 ${name}`,
                },
              ]),
            ],
          };
        },
      },
    ],
    execute: () => {
      const files = getNotepadFilenames();
      if (files.length === 0) {
        return {
          name: 'write',
          data: [
            [
              {
                type: 'text' as const,
                value: '(no files)',
                color: 'gray',
              },
            ],
          ],
        };
      }
      return {
        name: 'write',
        data: [
          [
            {
              type: 'text' as const,
              value: files.join('  '),
            },
          ],
        ],
      };
    },
  };
}
