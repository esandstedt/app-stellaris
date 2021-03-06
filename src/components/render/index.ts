import { System, Model, Country } from "@esandstedt/stellaris-model";

import { SystemVoronoi } from "./system/voronoi";
import { Point } from "./point";
import { Color, getSystemColor, getSystemOwner, WHITE } from "./color";
import { IDraw } from "./draw";
import { SimpleSystemPointGetter } from "./system/point/simple";
import { CentroidSystemPointGetter } from "./system/point/centroid";

const DEFAULT_COLOR = new Color(240, 240, 240);

function render(model: Model, draw: IDraw, options: any) {
  const systems = model.systems.getAll();

  const systemPointGetter = (() => {
    const fst = new CentroidSystemPointGetter(systems, "hull", {
      systemPointGetter: new SimpleSystemPointGetter(),
      hyperlane: {
        connectBorderSystems: true,
        spacing: 12,
      },
      border: {
        lowerBound: 40,
        upperBound: 50,
      },
    });

    const snd = new CentroidSystemPointGetter(systems, "hull", {
      systemPointGetter: fst,
      hyperlane: {
        connectBorderSystems: true,
        spacing: 10,
      },
      border: {
        lowerBound: 35,
        upperBound: 45,
      },
    });

    const thr = new CentroidSystemPointGetter(systems, "hull", {
      systemPointGetter: snd,
      hyperlane: {
        connectBorderSystems: true,
        spacing: 8,
      },
      border: {
        lowerBound: 30,
        upperBound: 40,
      },
    });

    return new CentroidSystemPointGetter(systems, "average", {
      systemPointGetter: thr,
      hyperlane: {
        connectBorderSystems: true,
        spacing: 6,
      },
      systemArea: {
        maxRadius: 5,
      },
      border: {
        lowerBound: 25,
        upperBound: 35,
      },
    });
  })();

  //const systemPointGetter = new SimpleSystemPointGetter();

  const voronoi = new SystemVoronoi(systems, {
    systemPointGetter,
    hyperlane: {
      connectBorderSystems: false,
      spacing: 4,
    },
    border: {
      lowerBound: 30,
      upperBound: 50,
    },
  });

  const getDrawPoint = (() => {
    const center = new Point(draw.width / 2, draw.height / 2);

    const ratio = systems
      .map((system) => systemPointGetter.get(system))
      .map((point) => {
        const ratioX = Math.abs(center.x / (1.1 * point.x));
        const ratioY = Math.abs(center.y / (1.1 * point.y));

        return [ratioX, ratioY];
      })
      .reduce((a, b) => a.concat(b), [])
      .reduce((a, b) => (a < b ? a : b), 1000);

    return (point: Point): Point =>
      new Point(
        Math.round(ratio * -point.x + center.x),
        Math.round(ratio * point.y + center.y)
      );
  })();

  // Draw background
  //draw.rect(new Point(0, 0), draw.width, draw.height, "#000000");

  // Draw systems
  systems.forEach((system) => {
    const color = getSystemColor(system, DEFAULT_COLOR);
    voronoi.getPolygons(system).forEach((polygon) => {
      draw.polygon(
        polygon.map(getDrawPoint),
        color === DEFAULT_COLOR
          ? DEFAULT_COLOR.toString()
          : color.blend(WHITE, 0.33).toString()
      );
    });
  });

  // Draw polygon borders
  /*
  systems.forEach((system) => {
    voronoi.getPolygons(system).forEach((polygon) => {
      draw.polyline(polygon.map(getDrawPoint), 1, "#000000", 0.1);
    });
  });
   */

  // Draw country borders
  voronoi.getPolygons().forEach((polygon) => {
    for (let i = 0; i < polygon.length - 1; i++) {
      const begin = getDrawPoint(polygon[i]);
      const end = getDrawPoint(polygon[i + 1]);

      const systems = voronoi.getSystems([polygon[i], polygon[i + 1]]);

      if (systems.length < 2) {
        continue;
      }

      let hyperlaneExists = false;
      if (systems.some((x) => x === null)) {
        // No hyperlane.
      } else {
        const [fst, snd] = systems as [System, System];
        hyperlaneExists = fst.hyperlanes.some((x) => x.to === snd);
      }

      const owners = new Set<Country | undefined | null>(
        systems.map((x) => (x !== null ? getSystemOwner(x) : null))
      );

      if (owners.size > 1) {
        if (Array.from(owners).every((x) => !x)) {
          // Don't render a border.
          /*
        } else if (hyperlaneExists) {
          draw.line(begin, end, 1, "#000000", 1);
         */
        } else {
          draw.line(begin, end, 3, "#000000", 1);
        }
      } else if (!hyperlaneExists) {
      }
    }
  });

  // Draw hyperlanes
  systems.forEach((system) => {
    const start = getDrawPoint(systemPointGetter.get(system));

    system.hyperlanes
      .filter(({ to }) => system.id < to.id)
      .forEach(({ to }) => {
        const end = getDrawPoint(systemPointGetter.get(to));
        draw.line(start, end, 1, "#000000", 0.5);
      });
  });

  // Draw systems
  systems.forEach((system) => {
    draw.circle(
      getDrawPoint(systemPointGetter.get(system)),
      1,
      "#000",
      "#000",
      1
    );
  });

  // Draw pop counts
  systems.forEach((system) => {
    const popCount = system.planets
      .map((x) => x.pops.length)
      .reduce((a, b) => a + b);

    if (0 < popCount) {
      const radius = Math.max(1, 1.5 * Math.sqrt(popCount / Math.PI));
      draw.circle(
        getDrawPoint(systemPointGetter.get(system)),
        radius,
        getSystemColor(system).toString(),
        "#000",
        1
      );
    }
  });

  // Draw starbases
  /*
  model.starbases
    .getAll()
    .filter(x => x.level !== "starbase_level_outpost")
    .forEach(starbase => {
      let size = 0;
      switch (starbase.level) {
        case "starbase_level_starport":
        case "starbase_level_starhold":
          size = 2;
          break;
        case "starbase_level_starfortress":
          size = 3;
          break;
        case "starbase_level_citadel":
        case "starbase_level_marauder":
        case "starbase_level_caravaneer":
          size = 4;
          break;
        default:
          console.log(starbase.level);
          break;
      }

      const { x, y } = getDrawPoint(systemPointGetter.get(starbase.system));
      draw.rect(
        new Point(x - size, y - size),
        2 * size + 1,
        2 * size + 1,
        "#fff"
      );
    });
   */

  // Draw voronoi points
  /*
  voronoi
    .getPoints()
    .map(getDrawPoint)
    .forEach((point) => draw.rect(point, 1, 1, "#f00"));
   */
}

export { render };
