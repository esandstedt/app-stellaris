import { System } from "@esandstedt/stellaris-model";
import { Point } from "../../point";

export interface ISystemPointGetter {
  get(system: System): Point;
}
