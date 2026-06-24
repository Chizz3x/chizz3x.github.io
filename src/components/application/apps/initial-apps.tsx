import { AppItem } from '../application';
import { TerminalApp } from './terminal';
import { LinkApp } from './link';
import { PlaylistApp } from './playlist';
import { NotepadApp } from './notepad';
import type { TVertical, THorizontal } from '../../../utils/desktop-grid';

export interface IInitialAppEntry {
  app: AppItem;
  placement: TVertical;
  horizontal: THorizontal;
}

const notepadIcon = '/app-icons/notepad.png';

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
    {
      app: new NotepadApp(onCloseApp, {
        aid: 'about-file',
        title: 'About',
        filename: 'about.txt',
        icon: notepadIcon,
        initialContent:
          'Chizz3x\n\n' +
          'Web, Automation and AI developer\n\n' +
          'Masters in AI (2024-2026). Over 6 years of hands-on experience in web development, ' +
          'specializing in TypeScript, JavaScript, React, Node.js, Next.js, and Nest.js. ' +
          'Strong background in machine learning, neural networks, and data analysis.\n\n' +
          'Contact: chizz3x@gmail.com',
      }),
      placement: 'bottom',
      horizontal: 'right',
    },
    {
      app: new NotepadApp(onCloseApp, {
        aid: 'skills-file',
        title: 'Skills',
        filename: 'skills.txt',
        icon: notepadIcon,
        initialContent:
          'Skills\n\n' +
          '  Languages:  TypeScript, JavaScript, Python, Java, C, C++, C#, PHP\n' +
          '  Frameworks: React, Next.js, Nest.js, Express.js\n' +
          '  Databases:  MongoDB, MySQL, PostgreSQL, MSSQL\n' +
          '  AI/ML:      Neural Networks, Data Analysis, Model Training',
      }),
      placement: 'bottom',
      horizontal: 'right',
    },
    {
      app: new NotepadApp(onCloseApp, {
        aid: 'projects-file',
        title: 'Projects',
        filename: 'projects.txt',
        icon: notepadIcon,
        initialContent:
          'Projects — use the open command to launch them!\n\n' +
          '  > open chizz3x     — Terminal (this!)\n' +
          '  > open my-playlist  — YouTube playlist',
      }),
      placement: 'bottom',
      horizontal: 'right',
    },
    {
      app: new NotepadApp(onCloseApp, {
        aid: 'readme-file',
        title: 'README',
        filename: 'readme.txt',
        icon: notepadIcon,
        initialContent:
          'Chizz3x Portfolio — README\n\n' +
          'Welcome to my interactive portfolio! This is a workdesk-style UI ' +
          'that lets you explore my projects, skills, and links in a fun way.\n\n' +
          'Available commands:\n' +
          '  help, whoami, neofetch, links, date, echo, calc, ls\n' +
          '  cat, fortune, banner, clear, open\n\n' +
          "Tip: Try 'cat <filename>' in the terminal to read a file!",
      }),
      placement: 'bottom',
      horizontal: 'right',
    },
    {
      app: new NotepadApp(onCloseApp, {
        aid: 'contact-file',
        title: 'Contact',
        filename: 'contact.txt',
        icon: notepadIcon,
        initialContent:
          'Contact\n\n' +
          'Email:   chizz3x@gmail.com\n' +
          'Discord: chizz3x\n' +
          'Telegram: petrol_m',
      }),
      placement: 'bottom',
      horizontal: 'right',
    },
  ];
}
