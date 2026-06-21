import { CommandBase, NCommandBase } from '../command-base';

export class CommandBanner extends CommandBase {
  static override base = 'banner';
  static override alts = ['chizz3x'];
  override args: NCommandBase.IArg = {
    execute: () => {
      return {
        name: 'write',
        data: [
          [],
          [
            {
              type: 'image' as const,
              value: 'banner.png',
            },
          ],
          [],
        ],
      };
    },
  };
}
