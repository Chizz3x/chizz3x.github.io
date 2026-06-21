import { CommandBase, NCommandBase } from '../command-base';

// Timestamp so uptime is relative to when the page loaded
const _pageLoad = Date.now();

export class CommandNeofetch extends CommandBase {
  static override base = 'neofetch';
  static override alts: string[] = [];
  override args: NCommandBase.IArg = {
    execute: () => {
      const uptime = Math.floor((Date.now() - _pageLoad) / 1000);
      const mins = Math.floor(uptime / 60);
      const secs = uptime % 60;

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
          [
            {
              type: 'text' as const,
              value: '  Chizz3x@portfolio',
              color: 'lime',
            },
          ],
          [
            {
              type: 'text' as const,
              value: '  ----------------',
              color: 'gray',
            },
          ],
          [
            {
              type: 'text' as const,
              value: `  OS:       Chizz3xOS 1.0`,
            },
          ],
          [
            {
              type: 'text' as const,
              value: `  Kernel:   ${navigator.platform || 'unknown'}`,
            },
          ],
          [
            {
              type: 'text' as const,
              value: `  Browser:  ${
                navigator.userAgent.match(
                  /Chrome\/\S+|Firefox\/\S+|Safari\/\S+|Edg\/\S+/,
                )?.[0] || 'unknown'
              }`,
            },
          ],
          [
            {
              type: 'text' as const,
              value: `  Terminal: Chizz3x Canvas Terminal`,
            },
          ],
          [
            {
              type: 'text' as const,
              value: `  Uptime:   ${mins}m ${secs}s`,
            },
          ],
          [
            {
              type: 'text' as const,
              value: `  Res:      ${window.innerWidth}x${window.innerHeight}`,
            },
          ],
          [],
        ],
      };
    },
  };
}
