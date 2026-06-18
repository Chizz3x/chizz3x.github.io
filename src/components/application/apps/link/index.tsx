import React from 'react';
import { AppItem } from '../../application';

export class LinkApp extends AppItem {
  url: string;
  newTab: boolean;

  constructor(
    destroyCB: () => void,
    config: {
      aid: string;
      title: string;
      url: string;
      icon?: string | React.ReactElement;
      newTab?: boolean;
    },
  ) {
    super(destroyCB);
    this.aid = config.aid;
    this.title = config.title;
    this.url = config.url;
    this.icon = config.icon ?? '/logo.png';
    this.newTab = config.newTab ?? true;
  }

  build(_fullScreen?: boolean) {
    setTimeout(() => {
      if (this.newTab) {
        window.open(this.url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = this.url;
      }
      this.destroy();
    }, 0);

    this.Application = <LinkPlaceholder />;
    return this.Application;
  }
}

const LinkPlaceholder = () => {
  return <div className="link-placeholder" />;
};
