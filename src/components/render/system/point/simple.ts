import { System } from "@esandstedt/stellaris-model";
import { Point } from "../../point";
import { ISystemPointGetter } from ".";

export class SimpleSystemPointGetter implements ISystemPointGetter {
  get(system: System): Point {
    const { x, y } = system.coordinate;
    return new Point(x, y);
  }
}
