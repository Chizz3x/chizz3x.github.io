import Two from "twojs-ts";
import defaultify from "../modules/utils/defaultify";
import { RecursivePartial } from "../types/typescript";

namespace NBlock {
	export interface IBlockSettings {
		pos: { x: number, y: number, z: 0 };
	}
}
const defaultBlockSettings: NBlock.IBlockSettings = {
  pos: { x: 0, y: 0, z: 0 }
};

class Block {
  private sprite: Two.Shape;
  private settings: NBlock.IBlockSettings;
  constructor(sprite: Two.Shape, settings?: RecursivePartial<NBlock.IBlockSettings>) {
    this.sprite = sprite;
    console.log(settings);
    this.settings = defaultify(defaultBlockSettings, settings);
    console.log(this.settings);
		
    sprite.translation.x = this.settings.pos?.x;
    sprite.translation.y = this.settings.pos?.y;
    console.log("bsets", this.settings);
  }

  get getSprite() {
    return this.sprite;
  } 
}

export default Block;
export { defaultBlockSettings };
export type { NBlock };
