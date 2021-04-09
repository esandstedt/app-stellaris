import { ISystemPointGetter } from ".";
import { SimpleSystemPointGetter } from "./simple";
import { CentroidSystemPointGetter } from "./centroid";
import { System } from "@esandstedt/stellaris-model";
import { Point } from "../../point";

export class LayeredCentroidSystemPointGetter implements ISystemPointGetter {
  private getter: ISystemPointGetter;

  constructor(systems: System[], iterations: number) {
    this.getter = new SimpleSystemPointGetter();

    for (let i = 0; i < iterations; i++) {
      this.getter = new CentroidSystemPointGetter(systems, {
        systemPointGetter: this.getter,
        includeHyperspacePoints: true,
        connectBorderSystems: true,
        centroidStrategy: "average",
      });
    }
  }

  public get(system: System): Point {
    return this.getter.get(system);
  }
}
