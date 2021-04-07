import { System, Model, Country } from "@esandstedt/stellaris-model";

import { SystemVoronoi } from "./system/voronoi";
import { Point } from "./point";
import { getSystemColor, Color, getSystemOwner } from "./color";
import { IDraw } from "./draw";
import { LayeredCentroidSystemPointGetter } from "./system/point/layered-centroid";

/*
function luminance(color: Color) {
  const [r, g, b] = [color.r, color.g, color.b]
    .map(x => x / 255)
    .map(x => {
      if (0.03928 < x) {
        return Math.pow((x + 0.055) / 1.055, 2.4);
      } else {
        return x / 12.92;
      }
    });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function setLuminance(color: Color, target: number) {
  let acc = 1.0;
  let step = 1.0;

  for (let i = 0; i < 6; i++) {
    const c = color.mult(acc);
    const current = luminance(c);

    if (current < target) {
      acc += step;
    } else {
      acc -= step;
    }

    step *= 0.5;
  }

  return color.mult(acc);
}
 */

// const origin = new Point(0, 0);

function render(model: Model, draw: IDraw) {
  const systems = model.systems.getAll();

  const systemPointGetter = new LayeredCentroidSystemPointGetter(systems, 2);
  const voronoi = new SystemVoronoi(systems, {
    systemPointGetter,
    includeHyperspacePoints: true,
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
  //draw.rect(origin, draw.width, draw.height, "#000000");

  // Draw systems
  systems.forEach((system) => {
    const color = getSystemColor(system, new Color(34, 34, 34));
    //color = new Color(240, 100, 0);

    // Normalise luminance and overlay pop counts
    /*
    const pops = system.planets
      .map(x => x.pops)
      .reduce((a, b) => a.concat(b), []);
    const ratio = Math.max(0, Math.min(pops.length / 300.0, 1));
    color = setLuminance(color, 0.05).add(300 * ratio);
     */

    voronoi.getPolygons(system).forEach((polygon) => {
      draw.polygon(polygon.map(getDrawPoint), color.toString());
    });
  });

  systems.forEach((system) => {
    voronoi.getPolygons(system).forEach((polygon) => {
      draw.polyline(polygon.map(getDrawPoint), 1, "#000000", 0.2);
    });
  });

  // Draw borders
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

        const set = new Set(
          fst.hyperlanes
            .map((x) => x.to)
            .concat(
              []
              /*
              fst.hyperlanes
                .map(x => x.to.hyperlanes)
                .reduce((a, b) => a.concat(b), [])
                .map(x => x.to)
               */
            )
        );

        hyperlaneExists = set.has(snd);
      }

      if (!hyperlaneExists) {
        draw.line(begin, end, 3, "#000000", 1);
      }

      const owners = new Set<Country>(
        systems
          .filter((x) => x !== null)
          .map((x) => x as System)
          .map(getSystemOwner)
          .filter((x) => typeof x !== "undefined")
          .map((x) => x as Country)
      );

      if (owners.size > 1) {
        draw.line(begin, end, 1, "#000000", 1);
      }
    }
  });

  // Draw hyperlanes
  /*
  systems.forEach(system => {
    const start = getDrawPoint(systemPointGetter.get(system));

    system.hyperlanes
      .filter(({ to }) => system.id < to.id)
      .forEach(({ to }) => {
        const end = getDrawPoint(systemPointGetter.get(to));
        draw.line(start, end, 1, "#ffffff", 0.25);
      });
  });
   */

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
    .forEach(point => draw.rect(point, 1, 1, "#f00"));
   */
}

export { render };
