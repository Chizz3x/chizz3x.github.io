import React from 'react';
import { AppItem, Application } from '../../application';
import { NTerminalApp } from './types';
import { CommandBase } from './command-base';
import { CommandWhoAmI } from './commands/whoami';
import { CommandHelp } from './commands/help';
import { CommandClear } from './commands/clear';
import { CommandLinks } from './commands/links';
import { CommandBanner } from './commands/banner';
import { CommandNeofetch } from './commands/neofetch';
import { CommandOpen } from './commands/open';
import { TerminalPage } from './TerminalPage';
import buildCommand from '../../../../utils/build-command';

export class TerminalApp extends AppItem {
  title = 'Chizz3x';
  aid = 'chizz3x';
  /** Callback to launch another app by aid from inside the terminal */
  onAppLaunch?: (aid: string) => void;

  newLinePrefix = '#Chizz3x>';
  initData: NTerminalApp.TPushData[][] = [
    [
      {
        type: 'text',
        value: 'Welcome to my canvas command line!',
      },
    ],
    [],
    [
      {
        type: 'image',
        value: 'banner.png',
      },
    ],
    [],
    [
      {
        type: 'text',
        value: 'Basic commands to start with:',
      },
    ],
    [
      {
        type: 'text',
        value: '> help [h] - Get some help, will ya?',
      },
    ],
    [
      {
        type: 'text',
        value: '> whoami [wai] - Generic information about me',
      },
    ],
    [],
  ];
  commands: Map<string, CommandBase> = new Map([
    ...buildCommand(CommandWhoAmI, new CommandWhoAmI()),
    ...buildCommand(CommandHelp, new CommandHelp()),
    ...buildCommand(CommandClear, new CommandClear()),
    ...buildCommand(CommandLinks, new CommandLinks()),
    ...buildCommand(CommandBanner, new CommandBanner()),
    ...buildCommand(CommandNeofetch, new CommandNeofetch()),
    ...buildCommand(CommandOpen, new CommandOpen()),
  ]);

  build(fullScreen?: boolean) {
    this.Application = (
      <Application
        key={this.aid || '0'}
        aid={this.aid || '0'}
        title={this.title || 'unknown'}
        icon={this.icon}
        onClose={this.destroy}
        fullScreen={fullScreen}
      >
        <TerminalPage
          newLinePrefix={this.newLinePrefix}
          initData={this.initData}
          commands={this.commands}
          onAppLaunch={this.onAppLaunch}
        />
      </Application>
    );
    return this.Application;
  }
}

// Re-export types so external consumers (command-base.ts, etc.) can still
// import { NTerminalApp } from '.'
export type { NTerminalApp } from './types';
