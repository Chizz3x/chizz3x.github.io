import Two from "twojs-ts";
// const ATwo: any = Two;
import { backgrounds, blocks, entities, foregrounds } from "../constants";
import Block, { NBlock } from "./Block";
import { RecursivePartial } from "../types/typescript";
import defaultify from "../modules/utils/defaultify";
import { AllObjects } from "../types/two";
import Player, { NPlayer } from "./Player";

/**
 * TODO:
 * - Check if z-index of each element is relative to how elements are added
 * - If it is not possible to manipulate z-index then modify the update();
 */

namespace NGame {
	export interface IGameSettings {
		fps: number;
		tileSize: number; // px
	}
}

const defaultGameSettings: NGame.IGameSettings = {
  fps: 30,
  tileSize: 24,
};

class Game {
  private settings: NGame.IGameSettings;
  private element: HTMLElement;
  private mainGroup: Two.Group;
  private background: Two.Group;
  private ground: Two.Group;
  private foreground: Two.Group;
  private two: Two;
  private atwo: any;
  private time: NodeJS.Timer;
  private player: Player | null;

  private objects: AllObjects[];

  constructor(props: { element: HTMLElement, settings?: RecursivePartial<NGame.IGameSettings> }) {
    const { element, settings } = props;

    this.settings = defaultify(defaultGameSettings, settings);

    this.element = element;

    const two = new Two({
      type: Two.Types.canvas,
      fullscreen: true,
    }).appendTo(element);
    this.two = two;
    this.atwo = this.two;

    this.objects = [];

    this.mainGroup = two.makeGroup([]);
    this.background = two.makeGroup([]);
    this.ground = two.makeGroup([]);
    this.foreground = two.makeGroup([]);

    this.mainGroup.add(
      this.background,
      this.ground,
      this.foreground
    );

    this.player = null;

    this.time = setInterval(() => {
      two.update();
    }, 1000 / this.settings.fps);
  }

  destroy() {
    const children = this.element.children;
    clearInterval(this.time);
    for(let i = 0; i < children.length; i++)
      children[i].remove();
    this.player?.destroy();
    this.player = null;
    this.two.clear();
  }

  get getTwo() {
    return this.two;
  }

  getDist(blockCount: number) {
    return blockCount * this.settings.tileSize;
  }

  private addObject(object: AllObjects, group: Two.Group) {
    (group || this.mainGroup).add(object.getSprite);
    this.objects.push(object);
    return; 
  }

  addPlayer(spritesFolder: string, settings?: RecursivePartial<NPlayer.IPlayerSettings>) {
    if(this.player) return;
    const sprite = this.atwo.makeSprite(blocks["solid_red"]);
    this.player = new Player(sprite, spritesFolder, settings);
    this.player.bindControls();
    this.addObject(this.player, this.ground);
  }

  /**
	 * Add block
	 */
  addBk(name: keyof typeof blocks, settings?: RecursivePartial<NBlock.IBlockSettings>, group: Two.Group = this.ground) {
    const sprite = this.atwo.makeSprite(blocks[name]);
    const bk = new Block(sprite, settings);
    this.addObject(bk, group);
  }

  /**
	 * Add background
	 */
  addBg(name: keyof typeof backgrounds, settings?: RecursivePartial<NBlock.IBlockSettings>, group: Two.Group = this.background) {
    const sprite = this.atwo.makeSprite(backgrounds[name]);
    const bg = new Block(sprite, settings);
    this.addObject(bg, group);
  }

  /**
	 * Add foreground
	 */
  addFg(name: keyof typeof foregrounds, group: Two.Group = this.foreground) {
    console.log(name);
  }

  /**
	 * Add entity
	 */
  addEnt(name: keyof typeof entities, group: Two.Group = this.ground) {
    console.log(name);
  }
}

export default Game;
export { defaultGameSettings };
export type { NGame };