import { AppItem } from '../application';
import { TerminalApp } from './terminal';
import { LinkApp } from './link';
import { PlaylistApp } from './playlist';
import type { TVertical, THorizontal } from '../../../utils/desktop-grid';

export interface IInitialAppEntry {
  app: AppItem;
  placement: TVertical;
  horizontal: THorizontal;
}

export function createInitialApps(
  onCloseApp: () => void,
  onAppLaunch?: (aid: string) => void,
): IInitialAppEntry[] {
  const terminal = new TerminalApp(onCloseApp);
  terminal.onAppLaunch = onAppLaunch;
  return [
    {
      app: terminal,
      placement: 'middle',
      horizontal: 'middle',
    },
    {
      app: new LinkApp(onCloseApp, {
        aid: 'youtube-ref',
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
        aid: 'discord-ref',
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
        aid: 'steam-ref',
        title: 'Steam',
        url: 'https://steamcommunity.com/id/Chizz3x',
        newTab: true,
        icon: '/app-icons/steam.png',
      }),
      placement: 'middle',
      horizontal: 'middle',
    },
    {
      app: new PlaylistApp(onCloseApp),
      placement: 'middle',
      horizontal: 'middle',
    },
  ];
}
