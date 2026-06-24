import React from 'react';
import { AppItem, Application } from '../../application';
import { NotepadPage } from './NotepadPage';
import { registerNotepad } from '../../notepad-registry';

export class NotepadApp extends AppItem {
  filename: string;
  initialContent: string;

  constructor(
    destroyCB: () => void,
    config: {
      aid: string;
      title: string;
      filename: string;
      icon?: string | React.ReactElement;
      initialContent?: string;
    },
  ) {
    super(destroyCB);
    this.aid = config.aid;
    this.title = config.title;
    this.filename = config.filename;
    this.icon = config.icon;
    this.initialContent = config.initialContent ?? '';

    // Register this notepad file in the shared registry so that terminal
    // commands like ls and cat can discover and read its content.
    registerNotepad({
      aid: config.aid,
      filename: config.filename,
      content: this.initialContent,
    });
  }

  build(fullScreen?: boolean) {
    this.Application = (
      <Application
        key={this.aid}
        aid={this.aid}
        title={this.title}
        icon={this.icon}
        onClose={this.destroy}
        fullScreen={fullScreen}
        defaultSize={{ width: 640, height: 480 }}
      >
        <NotepadPage
          filename={this.filename}
          initialContent={this.initialContent}
        />
      </Application>
    );
    return this.Application;
  }
}
