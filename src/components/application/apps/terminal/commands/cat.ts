import { CommandBase, NCommandBase } from '../command-base';
import { NTerminalApp } from '..';
import {
  getNotepadContent,
  getNotepadFilenames,
} from '../../../notepad-registry';

export class CommandCat extends CommandBase {
  static override base = 'cat';
  static override alts: string[] = [];
  override args: NCommandBase.IArg = {
    subArgs: [
      {
        name: 'help',
        alts: ['--help', '-h'],
        execute: () => {
          const files = getNotepadFilenames();
          return {
            name: 'write',
            data: [
              [
                {
                  type: 'text',
                  value: 'Usage: cat <filename>',
                  color: 'orange',
                },
              ],
              [
                {
                  type: 'text',
                  value: `Available files: ${files.join(', ') || '(none)'}`,
                  color: 'gray',
                },
              ],
            ],
          };
        },
      },
    ],
    execute: (args) => {
      const pattern = args[0];

      if (!pattern) {
        return {
          name: 'write',
          data: [
            [
              {
                type: 'text',
                value: 'Usage: cat <filename>',
                color: 'orange',
              },
            ],
            [
              {
                type: 'text',
                value: `Available files: ${
                  getNotepadFilenames().join(', ') || '(none)'
                }`,
                color: 'gray',
              },
            ],
          ],
        };
      }

      // Convert glob (* = any characters) to regex, case-insensitive
      const globToRegex = (glob: string): RegExp => {
        const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&');
        const regexStr = escaped.replace(/\*/g, '.*');
        return new RegExp(`^${regexStr}$`, 'i');
      };

      const patternRegex = globToRegex(pattern);
      const allFiles = getNotepadFilenames();
      let matching = allFiles.filter((f) => patternRegex.test(f));

      // Only allow .txt files through cat
      matching = matching.filter((f) => f.endsWith('.txt'));

      if (matching.length === 0) {
        return {
          name: 'write',
          data: [
            [
              {
                type: 'text',
                value: `cat: ${pattern}: No matching files`,
                color: 'red',
              },
            ],
          ],
        };
      }

      // Read content for each matching file, separated by a header
      const data: NTerminalApp.TPushData[][] = [];
      for (const file of matching) {
        const content = getNotepadContent(file);
        if (content === null) continue;

        if (data.length > 0) {
          data.push([]);
          data.push([
            {
              type: 'text',
              value: `── ${file} ──`,
              color: 'cyan',
            },
          ]);
          data.push([]);
        }

        const lines = content.split('\n');
        for (const line of lines) {
          data.push([
            {
              type: 'text' as const,
              value: line || ' ',
            },
          ]);
        }
      }

      if (data.length === 0) {
        return {
          name: 'write',
          data: [
            [
              {
                type: 'text',
                value: `cat: ${pattern}: No readable content`,
                color: 'red',
              },
            ],
          ],
        };
      }

      return { name: 'write', data };
    },
  };
}
