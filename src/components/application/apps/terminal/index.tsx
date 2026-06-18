import React from 'react';
import { AppItem, Application } from '../../application';
import { NTerminalApp } from './types';
import { CommandBase } from './command-base';
import { CommandWhoAmI } from './commands/whoami';
import { CommandHelp } from './commands/help';
import { CommandClear } from './commands/clear';
import { TerminalPage } from './TerminalPage';
import buildCommand from '../../../../utils/build-command';

export class TerminalApp extends AppItem {
  title = 'Chizz3x';
  aid = '1';

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
        />
      </Application>
    );
    return this.Application;
  }
}

// Re-export types so external consumers (command-base.ts, etc.) can still
// import { NTerminalApp } from '.'
export type { NTerminalApp } from './types';
