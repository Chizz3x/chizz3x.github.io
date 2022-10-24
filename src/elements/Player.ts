import Two from "twojs-ts";
import defaultify from "../modules/utils/defaultify";
import { RecursivePartial, TAnyRecord } from "../types/typescript";

namespace NPlayer {
	export interface IPlayerSettings {
		pos: { x: number, y: number };
		movement: IMovement;
		controls: IControls;
	}

	export interface IMovement {
		x: number;
		y: number;
		instant: boolean;
	}

	export interface IMove {
		x: number;
		y: number;
	}

	export interface IControls {
		up: string[],
		down: string[],
		left: string[],
		right: string[],
	}
}

const startSpeeds = {
  x: 0.1,
  y: 0.1
};

const speedMultiplier = {
  x: 1.01,
  y: 1.01
};

const maxSpeed = 0.5;

const defaultPlayerControlsSettings: NPlayer.IControls = {
  up: ["ArrowUp", "KeyW"],
  down: ["ArrowDown", "KeyS"],
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
};

const defaultPlayerMovementSettings: NPlayer.IMovement = {
  x: 0,
  y: 0,
  instant: false,
};

const defaultPlayerSettings: NPlayer.IPlayerSettings = {
  pos: { x: 0, y: 0 },
  movement: defaultPlayerMovementSettings,
  controls: defaultPlayerControlsSettings,
};

class Player {
  folder: string;
  settings: NPlayer.IPlayerSettings;
  sprites: TAnyRecord;
  sprite: Two.Shape;
  timeout?: NodeJS.Timeout;
  moveInterval?: NodeJS.Timer;
  controlsHandler: ((...args: any) => any) | null;
  pressedInMoves: string[];

  constructor(sprite: Two.Shape, spritesFolder: string, settings?: RecursivePartial<NPlayer.IPlayerSettings>) {
    this.sprite = sprite;
    this.folder = spritesFolder;
    this.settings = defaultify(defaultPlayerSettings, settings);
    this.sprites = {
      default: `${spritesFolder}/animations/idle/idle_down.1.png`,
      animations: {
        idle: new Array(4).fill(null).map((_, i) => `${spritesFolder}/animations/idle/idle_down.${i + 1}.png`)
      }
    };
    this.controlsHandler = null;
    this.pressedInMoves = [];
  }

  destroy() {
    if(this.timeout)
      clearTimeout(this.timeout);
    if(this.controlsHandler) {
      window.removeEventListener("keyup", this.controlsHandler);
      window.removeEventListener("keydown", this.controlsHandler);
    }
  }

  private setTimeout(fn: (...args: any) => any, time: number, ...params: any) {
    if(this.timeout)
      clearTimeout(this.timeout);
    this.timeout = setTimeout((...args) => {
      fn(...args);
      this.timeout = undefined;
    }, time, params);
  }

  move(settings?: RecursivePartial<NPlayer.IMove>) {
    const sets = defaultify(defaultPlayerMovementSettings, settings);

    this.settings.pos.x += sets.x;
    this.settings.pos.y += sets.y;
    this.sprite.translation =new Two.Vector(this.settings.pos.x, this.settings.pos.y);

    this.setTimeout(() => {
      console.log("timeout");
    }, 1000);
  }

  getMoveDirection(code: string) {
    let dir = undefined;
    const keys = Object.keys(defaultPlayerControlsSettings) as (keyof typeof defaultPlayerControlsSettings)[];
    for(const key of keys)
      if(defaultPlayerControlsSettings[key].includes(code)) {
        dir = key;
        break;
      }
    return dir;
  }

  private handleControl = (player: Player) => (event: KeyboardEvent) => {
    const action = event.type;
    const dir = this.getMoveDirection(event.code);
    if(action === "keydown") {
      if(!this.pressedInMoves.includes(event.code))
        this.pressedInMoves.push(event.code);
      this.settings.movement = defaultify(defaultPlayerMovementSettings, {
        x: dir === "left" ? -startSpeeds.x : dir === "right" ? startSpeeds.x : this.settings.movement.x ,
        y: dir === "up" ? -startSpeeds.y : dir === "down" ? startSpeeds.y : this.settings.movement.y
      });
      if(!this.moveInterval)
        this.moveInterval = setInterval(() => {
          const newX = this.settings.movement.x * speedMultiplier.x * speedMultiplier.x;
          const newY = this.settings.movement.y * speedMultiplier.y * speedMultiplier.y;
          this.settings.movement = defaultify(defaultPlayerMovementSettings, {
            x: Math.min(newX, maxSpeed),
            y: Math.min(newY, maxSpeed)
          });
          player.move({ x: this.settings.movement.x, y: this.settings.movement.y });
        }, 1);
    }
    if(action === "keyup") {
      console.log(this.settings.movement);
      if(this.pressedInMoves.includes(event.code))
        this.pressedInMoves.splice(this.pressedInMoves.indexOf(event.code), 1);
      this.settings.movement = defaultify(defaultPlayerMovementSettings, {
        x: !defaultPlayerControlsSettings.left.some(s => this.pressedInMoves.includes(s))
					&& !defaultPlayerControlsSettings.right.some(s => this.pressedInMoves.includes(s)) ? 0
          : this.settings.movement.x,
        y: !defaultPlayerControlsSettings.up.some(s => this.pressedInMoves.includes(s))
					&& !defaultPlayerControlsSettings.down.some(s => this.pressedInMoves.includes(s)) ? 0
          : this.settings.movement.y
      });
      if(!this.pressedInMoves.length && this.moveInterval) {
        clearInterval(this.moveInterval);
        this.moveInterval = undefined;
      }
    }
  };

  bindControls(settings?: RecursivePartial<NPlayer.IControls>) {
    if(this.controlsHandler) return;
    this.controlsHandler = this.handleControl(this);
    this.settings.controls = defaultify(defaultPlayerControlsSettings, settings);
    window.addEventListener("keyup", this.controlsHandler);
    window.addEventListener("keydown", this.controlsHandler);
  }

  get getSprite() {
    return this.sprites.default;
  } 
}

export default Player;
export type { NPlayer };
export { defaultPlayerSettings, defaultPlayerMovementSettings };