import React from 'react';
import styled from 'styled-components';
import { AppItem, Application } from '../../application';

export class PlaylistApp extends AppItem {
  title = 'My Playlist';
  aid = 'my-playlist';
  icon = '/app-icons/youtube-music.png';

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
        <PlaylistPage />
      </Application>
    );
    return this.Application;
  }
}

const PlaylistPage = () => {
  return (
    <PlaylistPageStyle>
      <iframe
        width="100%"
        height="100%"
        src="https://www.youtube.com/embed/videoseries?si=WtnMrlkhbgvM1g7M&amp;list=PLfezFYfD_siUUx8PZZmBWsOlqCBFQa_Sm"
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </PlaylistPageStyle>
  );
};

const PlaylistPageStyle = styled.div`
  flex-grow: 1;
  display: flex;
  iframe {
    border: none;
  }
`;
