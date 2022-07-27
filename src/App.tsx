import React from "react";
import styled from "styled-components";
import "./App.css";

import Two from "twojs-ts";
const ATwo: any = Two;
import { backgrounds, blocks, entities, foregrounds } from "./constants";

type TAnyRecord = Record<string | number | symbol, any>;

namespace NGame {
	export interface IGameSettings {
		fps: number;
	}
}

namespace NBlock {
	export interface IBlockSettings {
		pos?: { x?: number, y?: number, z?: 0 }
	}
}
const defaultBlockSettings: NBlock.IBlockSettings = {
  pos: { x: 0, y: 0, z: 0 }
};

class Block {
  private sprite: any;
  private settings: any;
  constructor(sprite: any, settings: NBlock.IBlockSettings) {
    this.sprite = sprite;
    this.settings = { ...defaultBlockSettings, ...settings };
  }
}

class Game {
  private element: HTMLElement;
  private two: Two;
  private atwo: any;
  private time: NodeJS.Timer;

  private objects: (Block)[];

  constructor(props: { element: HTMLElement, settings: NGame.IGameSettings }) {
    const { element, settings } = props;

    this.element = element;

    const two = new Two({
      type: Two.Types.canvas,
      fullscreen: true,
    }).appendTo(element);
    this.two = two;
    this.atwo = this.two;

    this.objects = [];

    this.time = setInterval(() => {
      two.update();
    }, 1000 / settings.fps);
  }

  destroy() {
    const children = this.element.children;
    clearInterval(this.time);
    for(let i = 0; i < children.length; i++)
      children[i].remove();
    this.two.clear();
  }

  /**
	 * Add block
	 */
  addBk(name: keyof typeof blocks) {
    const sprite = this.atwo.makeSprite(blocks[name]);
    this.objects.push(new Block(sprite, { pos: { x: this.two.width / 2 } }));
    sprite.translation.x = this.two.width / 2;
    sprite.translation.y = this.two.height / 2;
    console.log(sprite);
  }

  /**
	 * Add background
	 */
  addBg(name: keyof typeof backgrounds) {
    console.log(name);
  }

  /**
	 * Add foreground
	 */
  addFg(name: keyof typeof foregrounds) {
    console.log(name);
  }

  /**
	 * Add entity
	 */
  addEnt(name: keyof typeof entities) {
    console.log(name);
  }
}

const gameSettings: NGame.IGameSettings = {
  fps: 30,
};

const App = () => {
  const refContainer = React.useRef<HTMLDivElement | null>(null);

  console.log("init");
  const initGame = (game: Game) => {
    game.addBk("solid_red");
  };

  React.useEffect(() => {
    let game: Game | null;
    if(refContainer?.current) {
      game = new Game({
        element: refContainer.current,
        settings: gameSettings,
      });

      console.log("els", refContainer.current.children);

      initGame(game);
    }
		
    return () => {
      if(game) {
        game?.destroy();
        game = null;
      }
    };
  }, [refContainer]);

  return (
    <AppStyle className="App">
      <div ref={refContainer} />
    </AppStyle>
  );
};

export default App;

const AppStyle = styled.div`
	#MAIN {
		display: block;
	}
`;
