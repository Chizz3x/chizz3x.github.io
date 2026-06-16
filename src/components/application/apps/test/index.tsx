import React from 'react';
import { AppItem, Application } from '../../application';

export class TestApp extends AppItem {
  icon = '/logo.png';
  title = 'Test';
  aid = '0';

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
        <TestPage />
      </Application>
    );
    return this.Application;
  }
}

const TestPage = (props: NTestApp.IProps) => {
  return <div>hi</div>;
};

export namespace NTestApp {
  export interface IProps {
    //
  }
}
