import { CommandBase, NCommandBase } from '../command-base';

export class CommandLinks extends CommandBase {
  static override base = 'links';
  static override alts = ['ln', 'social'];
  override args: NCommandBase.IArg = {
    execute: () => {
      return {
        name: 'write',
        data: [
          [],
          [
            {
              type: 'text',
              value: 'Social links',
              color: 'lime',
            },
          ],
          [],
          [
            {
              type: 'link',
              value: 'YouTube',
              url: 'https://www.youtube.com/c/chizz3x',
              color: '#00bcd4',
            },
          ],
          [
            {
              type: 'text',
              value: '  https://www.youtube.com/c/chizz3x',
              color: 'gray',
            },
          ],
          [],
          [
            {
              type: 'link',
              value: 'Discord',
              url: 'https://discord.gg/zG83r6M',
              color: '#00bcd4',
            },
          ],
          [
            {
              type: 'text',
              value: '  https://discord.gg/zG83r6M',
              color: 'gray',
            },
          ],
          [],
          [
            {
              type: 'link',
              value: 'Steam',
              url: 'https://steamcommunity.com/id/Chizz3x',
              color: '#00bcd4',
            },
          ],
          [
            {
              type: 'text',
              value: '  https://steamcommunity.com/id/Chizz3x',
              color: 'gray',
            },
          ],
          [],
          [
            {
              type: 'link',
              value: 'Email',
              url: 'mailto:chizz3x@gmail.com',
              color: '#00bcd4',
            },
          ],
          [
            {
              type: 'text',
              value: '  chizz3x@gmail.com',
              color: 'gray',
            },
          ],
        ],
      };
    },
  };
}
