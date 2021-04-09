import { ISystemPointGetter } from ".";
import { SystemVoronoi } from "../voronoi";
import { Point } from "../../point";
import { System } from "@esandstedt/stellaris-model";
import { polygonCentroid, polygonHull } from "d3-polygon";

interface CentroidSystemPointGetterOptions {
  systemPointGetter: ISystemPointGetter;
  includeHyperspacePoints: boolean;
  centroidStrategy: "system" | "hull" | "average";
}

export class CentroidSystemPointGetter implements ISystemPointGetter {
  private voronoi: SystemVoronoi;
  private points: { [key: string]: Point };

  constructor(systems: System[], options: CentroidSystemPointGetterOptions) {
    this.voronoi = new SystemVoronoi(systems, {
      systemPointGetter: options.systemPointGetter,
      includeHyperspacePoints: options.includeHyperspacePoints,
    });

    this.points = {};
    systems.forEach((system) => {
      const polygons = this.voronoi.getPolygons(system);

      let centroid: [number, number] = [0, 0];

      if (options.centroidStrategy === "system") {
        centroid = polygonCentroid(
          polygons[0].map((p) => [p.x, p.y] as [number, number])
        );
      } else if (options.centroidStrategy === "hull") {
        const hull = polygonHull(
          polygons
            .reduce((a, b) => a.concat(b), [])
            .map((point) => [point.x, point.y] as [number, number])
        );

        if (hull == null) {
          throw new Error();
        }

        centroid = polygonCentroid(hull);
      } else if ("average") {
        const centroids = polygons.map((polygon) =>
          polygonCentroid(polygon.map((p) => [p.x, p.y] as [number, number]))
        );

        const sum = centroids.reduce((a, b) => [a[0] + b[0], a[1] + b[1]]);
        const length = centroids.length;
        centroid = [sum[0] / length, sum[1] / length];
      } else {
        throw new Error();
      }

      const [x, y] = centroid;
      this.points[system.id] = new Point(x, y);
    });
  }

  get(system: System): Point {
    return this.points[system.id];
  }
}
