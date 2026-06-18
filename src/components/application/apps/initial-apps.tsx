import { AppItem } from '../application';
import { TerminalApp } from './terminal';
import { LinkApp } from './link';
import type { TVertical, THorizontal } from '../../../utils/desktop-grid';

export interface IInitialAppEntry {
  app: AppItem;
  placement: TVertical;
  horizontal: THorizontal;
}

export function createInitialApps(onCloseApp: () => void): IInitialAppEntry[] {
  return [
    {
      app: new TerminalApp(onCloseApp),
      placement: 'middle',
      horizontal: 'middle',
    },
    {
      app: new LinkApp(onCloseApp, {
        aid: '2',
        title: 'YouTube',
        url: 'https://www.youtube.com/c/chizz3x',
        newTab: true,
        icon: '/app-icons/youtube.png',
      }),
      placement: 'middle',
      horizontal: 'middle',
    },
    {
      app: new LinkApp(onCloseApp, {
        aid: '3',
        title: 'Discord',
        url: 'https://discord.gg/zG83r6M',
        newTab: true,
        icon: '/app-icons/discord.png',
      }),
      placement: 'middle',
      horizontal: 'middle',
    },
    {
      app: new LinkApp(onCloseApp, {
        aid: '4',
        title: 'Steam',
        url: 'https://steamcommunity.com/id/Chizz3x',
        newTab: true,
        icon: '/app-icons/steam.png',
      }),
      placement: 'middle',
      horizontal: 'middle',
    },
  ];
}
