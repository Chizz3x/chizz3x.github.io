import { CommandBase, NCommandBase } from '../command-base';
import { NTerminalApp } from '..';

const responses = [
  'Nice try.',
  'Permission denied. Try harder.',
  "You don't have the power here.",
  'Actually no.',
  'sudo: effective uid is not root, sorry.',
  'Nice try, but this terminal is sandboxed.',
  'Access denied. Go touch grass.',
  'sudo: command not found',
  '[sudo] password for chizz3x: ********\nSorry, try again.',
];

export class CommandSudo extends CommandBase {
  static override base = 'sudo';
  static override alts: string[] = [];
  override args: NCommandBase.IArg = {
    execute: (args) => {
      const remainder = args.join(' ');
      const response = responses[Math.floor(Math.random() * responses.length)];
      const rows: NTerminalApp.TPushData[][] = [
        [
          {
            type: 'text',
            value: response,
            color: 'red',
          },
        ],
      ];
      if (remainder) {
        rows.push([
          {
            type: 'text',
            value: `Nice try with "${remainder}" too.`,
            color: 'orange',
          },
        ]);
      }
      return { name: 'write', data: rows };
    },
  };
}
