import { System, Hyperlane } from "@esandstedt/stellaris-model";
import { Delaunay, Voronoi } from "d3-delaunay";
import { Point } from "../point";
import { ISystemPointGetter } from "./point";
import { SimpleSystemPointGetter } from "./point/simple";

export interface SystemVoronoiOptions {
  systemPointGetter?: ISystemPointGetter;
  includeHyperspacePoints?: boolean;
}

export class SystemVoronoi {
  private systemPointGetter: ISystemPointGetter;

  private systems: { [id: string]: System } = {};
  private systemPoints: { [id: string]: number[] } = {};
  private pointSystem: { [index: number]: string } = {};
  private pointCells: { [x: number]: { [y: number]: number[] } } = {};
  private points: Point[] = [];
  private voronoi: Voronoi<number[]>;

  constructor(systems: System[], private options: SystemVoronoiOptions) {
    this.systemPointGetter =
      options.systemPointGetter || new SimpleSystemPointGetter();

    this.systems = {};
    systems.forEach((x) => (this.systems[x.id] = x));

    this.systemPoints = {};
    this.pointSystem = {};
    this.points = [];

    systems.forEach(({ id }) => (this.systemPoints[id] = []));

    this.addSystemPoints(systems);
    if (this.options.includeHyperspacePoints) {
      this.addHyperspacePoints(systems);
    }
    this.addBorderPoints();
    //this.addRingPoints();

    const delaunay = Delaunay.from(this.points.map(({ x, y }) => [x, y]));
    this.voronoi = delaunay.voronoi([-1000, -1000, 1000, 1000]);

    this.points.forEach((_, i) => {
      const cell = this.voronoi.cellPolygon(i);

      if (!cell) {
        return;
      }

      for (let j = 0; j < cell.length - 1; j++) {
        const point = cell[j];
        const x = point[0];
        const y = point[1];

        if (!this.pointCells[x]) {
          this.pointCells[x] = {};
        }

        if (!this.pointCells[x][y]) {
          this.pointCells[x][y] = [];
        }

        this.pointCells[x][y].push(i);
      }
    });
  }

  private addSystemPoints(systems: System[]) {
    systems.forEach((system) => {
      const index = this.points.length;

      this.systemPoints[system.id].push(index);
      this.pointSystem[index] = system.id;

      this.points.push(this.systemPointGetter.get(system));
    });
  }

  private addHyperspacePoints(systems: System[]) {
    const hyperlanes: Hyperlane[] = [];
    systems.forEach((system) =>
      system.hyperlanes
        .filter((x) => x.from.id < x.to.id)
        .forEach((x) => hyperlanes.push(x))
    );

    hyperlanes.forEach(({ from, to }) => {
      const fromPoint = this.systemPointGetter.get(from);
      const toPoint = this.systemPointGetter.get(to);

      const distance = fromPoint.distance(toPoint);

      let t = Math.max(5, Math.floor(distance / 10));
      if (t % 2 === 0) {
        t += 1;
      }

      for (let i = 1; i < t; i++) {
        const system = i * 2 < t ? to : from;
        const index = this.points.length;

        this.systemPoints[system.id].push(index);
        this.pointSystem[index] = system.id;

        this.points.push(
          new Point(
            (i * fromPoint.x) / t + ((t - i) * toPoint.x) / t,
            (i * fromPoint.y) / t + ((t - i) * toPoint.y) / t
          )
        );
      }
    });
  }

  private addBorderPoints() {
    const limit = 30;

    const points: Point[] = [];

    this.points.forEach((point) => {
      const neighbors = this.points
        .filter((x) => x !== point)
        .filter((x) => point.distance(x) < 2.5 * limit);

      for (let i = 0; i < 32; i++) {
        const angle = (2 * Math.PI * i) / 32;

        const validPoint = this.getValidBorderPoint(point, neighbors, angle);
        if (validPoint) {
          points.push(validPoint);
        }
      }
    });

    points.forEach((x) => this.points.push(x));
  }

  private getValidBorderPoint(point: Point, neighbors: Point[], angle: number) {
    const limit = 30;

    const offset = new Point(Math.cos(angle), Math.sin(angle));
    for (var i = 30; i < 32; i++) {
      const current = point.add(offset.mult(i));
      const valid = neighbors.every((x) => current.distance(x) > limit);
      if (valid) {
        return current;
      }
    }
  }

  public getPolygons(
    system: System | undefined = undefined,
    merge = true
  ): Point[][] {
    let polygons: number[][][] = [];
    if (typeof system === "undefined") {
      polygons = Array.from(this.voronoi.cellPolygons())
        .filter((x) => x !== null)
        .map((polygon) => {
          polygon.pop();
          return polygon;
        });
    } else {
      polygons = this.systemPoints[system.id]
        .map((i) => this.voronoi.cellPolygon(i))
        .filter((x) => x !== null)
        .map((polygon) => {
          polygon.pop();
          return polygon;
        });

      if (merge) {
        polygons = this.mergePolygons(polygons);
      }
    }

    return polygons.map((polygon) => polygon.map(([x, y]) => new Point(x, y)));
  }

  private mergePolygons(input: number[][][]) {
    // Implementation of this method:
    // https://stackoverflow.com/questions/21217218/find-and-discard-shared-edges-between-polygons

    if (input.length < 2) {
      return input;
    }

    const vertexArray: number[][] = [];
    const vertexCounts: { [index: number]: number } = {};
    const edgeCounts: {
      [key: string]: { count: number; polygonIndices: number[] };
    } = {};

    const polygons = input.map((polygon) =>
      polygon.map((vertex) => {
        let index: number;

        const existing = vertexArray.find(
          (x) => x[0] === vertex[0] && x[1] === vertex[1]
        );
        if (existing) {
          index = vertexArray.indexOf(existing);
          vertexCounts[index] += 1;
        } else {
          index = vertexArray.length;
          vertexArray.push(vertex);
          vertexCounts[index] = 1;
        }

        return index;
      })
    );

    polygons.forEach((polygon, polygonIndex) => {
      for (let i = 0; i < polygon.length; i++) {
        const a = polygon[i];
        const b = polygon[(i + 1) % polygon.length];

        let key: string;
        if (a < b) {
          key = `${a},${b}`;
        } else {
          key = `${b},${a}`;
        }

        if (key in edgeCounts) {
          edgeCounts[key].count += 1;
          edgeCounts[key].polygonIndices.push(polygonIndex);
        } else {
          edgeCounts[key] = {
            count: 1,
            polygonIndices: [polygonIndex],
          };
        }
      }
    });

    const start = (() => {
      for (let i = 0; i < polygons.length; i++) {
        const polygon = polygons[i];
        for (let j = 0; j < polygon.length; j++) {
          const vertex = polygon[j];
          if (vertexCounts[vertex] === 1) {
            return { polygonIndex: i, vertexIndex: j };
          }
        }
      }

      throw new Error("could not get start");
    })();

    const result = [];

    let ctx = { ...start };
    let counter = 0;

    do {
      const polygon = polygons[ctx.polygonIndex];
      const current = polygon[ctx.vertexIndex];

      result.push(current);

      const vertexCount = vertexCounts[current];
      if (vertexCount === 1) {
        ctx.vertexIndex = (ctx.vertexIndex + 1) % polygon.length;
      } else {
        const next = polygon[(ctx.vertexIndex + 1) % polygon.length];
        const edgeKey =
          current < next ? `${current},${next}` : `${next},${current}`;

        const nextPolygonIndex = edgeCounts[edgeKey].polygonIndices.filter(
          (x) => x !== ctx.polygonIndex
        )[0];
        const nextPolygon = polygons[nextPolygonIndex];

        ctx = {
          polygonIndex: nextPolygonIndex,
          vertexIndex: (nextPolygon.indexOf(current) + 1) % nextPolygon.length,
        };
      }

      counter += 1;
      if (100 < counter) {
        break;
      }
    } while (
      ctx.polygonIndex !== start.polygonIndex ||
      ctx.vertexIndex !== start.vertexIndex
    );

    return [result.map((i) => vertexArray[i])];
  }

  public getSystems(line: [Point, Point]): Array<System | null> {
    const [begin, end] = line;

    const beginCells = this.pointCells[begin.x][begin.y];
    const endCells = this.pointCells[end.x][end.y];

    const matches = Array.from(
      new Set(beginCells.filter((x) => endCells.includes(x)))
    );

    const ids = Array.from(
      new Set(matches.map((index) => this.pointSystem[index]))
    );

    return ids.map((id) => (id ? this.systems[id] : null));
  }

  public getPoints(): Point[] {
    return this.points.map(({ x, y }) => new Point(x, y));
  }
}
