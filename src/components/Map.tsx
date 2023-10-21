import { Model } from "@/model/Model";
import React from "react";
import * as d3 from "d3";

function onlyUnique<T>(value: T, index: number, array: T[]) {
  return array.indexOf(value) === index;
}

const COLORS: { [key: string]: string } = {
  black: "#262626",
  blue: "#3b82f6",
  brown: "#b45309",
  burgundy: "#be123c",
  dark_blue: "#1d4ed8",
  dark_brown: "#78350f",
  dark_grey: "#525252",
  dark_green: "#15803d",
  dark_purple: "#7e22ce",
  dark_red: "#b91c1c",
  dark_teal: "#0f766e",
  indigo: "#6366f1",
  green: "#22c55e",
  grey: "#a3a3a3",
  ocean_turquoise: "#06b6d4",
  orange: "#f59e0b",
  pink: "#fbcfe8",
  purple: "#a855f7",
  red: "#ef4444",
  red_orange: "#f97316",
  teal: "#14b8a6",
  turquoise: "#06b6d4",
  yellow: "#fde047",
};

function mapColor(color: string) {
  if (COLORS[color]) {
    return COLORS[color];
  } else {
    console.info("Unmapped color " + color);
    return "white";
  }
}

type Point = [number, number];

interface Props {
  model: Model;
  width: number;
  height: number;
}

interface State {
  nodes: { key: string; x: number; y: number }[];
}

export class Map extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      nodes: [],
    };
  }

  componentDidMount(): void {
    const nodes = this.props.model.galacticObjects.map((obj) => ({
      obj,
      x: obj.x,
      y: obj.y,
    }));

    const links = this.props.model.galacticObjects
      .map((obj) =>
        obj.hyperlanes
          .map(({ to }) => ({ from: obj.key, to }))
          .map(({ from, to }) => {
            const source = nodes.find((x) => x.obj.key === from);
            const target = nodes.find((x) => x.obj.key === to);

            if (!source || !target) {
              throw new Error();
            }

            return {
              source,
              target,
            };
          })
      )
      .reduce((a, b) => a.concat(b));

    const simulation = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink(links).distance(10).strength(1))
      .force("center", d3.forceCenter())
      .force("collide", d3.forceCollide().radius(10))
      .force("x", d3.forceX((node) => (node as any).obj.x).strength(1.5))
      .force("y", d3.forceY((node) => (node as any).obj.y).strength(1.5));

    for (let i = 0; i < 100; i++) {
      simulation.tick();
    }
    simulation.stop();

    this.setState({
      nodes: nodes.map(({ obj, x, y }) => ({ key: obj.key, x, y })),
    });
  }

  getScale() {
    const ex = this.props.width / 2;
    const ey = this.props.height / 2;

    if (!this.state.nodes.length) {
      return 1.0;
    }

    let mx = 0;
    let my = 0;
    this.state.nodes.forEach(({ x, y }) => {
      mx = Math.max(mx, Math.abs(x));
      my = Math.max(mx, Math.abs(x));
    });

    const rx = (0.9 * ex) / mx;
    const ry = (0.9 * ey) / my;

    return Math.min(rx, ry);
  }

  render() {
    const { width, height } = this.props;
    const scale = this.getScale();

    const controlledObjects = this.props.model.countries
      .filter(
        (x) =>
          x.type === "default" ||
          x.type === "caravaneer_home" ||
          x.type === "dormant_marauders" ||
          x.type === "fallen_empire"
      )
      .map((x) => (x.controlledPlanets || []).map((y) => [y, x.key]))
      .reduce((a, b) => a.concat(b), [])
      .map((x) => {
        const obj = this.props.model.planets.find(
          (y) => y.key === x[0]
        )?.galacticObject;
        return [obj, x[1]];
      });

    const objects = this.state.nodes.map<{ key: string; point: Point }>(
      (node) => ({
        key: node.key,
        point: [-scale * node.x + width / 2, scale * node.y + height / 2],
      })
    );

    const lines = this.props.model.galacticObjects
      .filter((x) => this.state.nodes.findIndex((y) => y.key == x.key) !== -1)
      .map((obj) => obj.hyperlanes.map(({ to }) => ({ from: obj.key, to })))
      .reduce((prev, cur) => prev.concat(cur), [])
      .filter(({ from, to }) => from < to)
      .map(({ from, to }) => {
        const f = objects.find((x) => x.key === from);
        const t = objects.find((x) => x.key === to);

        if (!f || !t) {
          throw new Error();
        }

        return {
          from,
          to,
          x1: f.point[0],
          y1: f.point[1],
          x2: t.point[0],
          y2: t.point[1],
        };
      });

    const delaunay = d3.Delaunay.from(objects.map((x) => x.point));
    const voronoi = delaunay.voronoi([0, 0, width, height]);

    function getShell(index: number, size: number): Point[] {
      const p = objects[index].point;

      const shell: Point[] = [];
      for (var i = 360; i > 0; i -= 15) {
        shell.push([
          p[0] + size * Math.cos((i * Math.PI) / 180),
          p[1] + size * Math.sin((i * Math.PI) / 180),
        ]);
      }

      return shell;
    }

    function intersection(index: number, size: number) {
      const a = getShell(index, scale * size);
      const b = voronoi.cellPolygon(index);
      try {
        return polygonClip(a, b) || [];
      } catch (error) {
        console.error({
          message: "Could not calculate intersection",
          index,
          a,
          b,
        });
        throw error;
      }
    }

    function polygonPoints(points: Point[]): string {
      return points.map((p) => `${p[0]},${p[1]}`).join(" ");
    }

    return (
      <svg width={width} height={height}>
        {objects.map((obj, i) => (
          <polygon
            key={i}
            fill="#eee"
            points={polygonPoints(intersection(i, 20))}
          />
        ))}

        {objects.map((obj, i) => {
          const controllingCountries = controlledObjects
            .filter((x) => x[0] === obj.key)
            .map((x) => x[1])
            .filter(onlyUnique);

          if (controllingCountries.length === 0) {
            return null;
          }

          let fill = "#ddd";
          if (controllingCountries.length === 1) {
            const country = this.props.model.countries.find(
              (x) => x.key === controllingCountries[0]
            );
            if (country) {
              fill = mapColor(country.color);
            }
          }

          return (
            <polygon
              key={i}
              strokeWidth={1 * scale}
              stroke={fill}
              fill={fill}
              points={polygonPoints(intersection(i, 20))}
            />
          );
        })}

        {lines.map((line, index) => (
          <line
            key={`${line.from}-${line.to}-${index}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="black"
            strokeWidth={1 * scale}
            opacity={0.2}
          />
        ))}
        {objects.map(({ key, point }) => (
          <circle
            key={key}
            cx={point[0]}
            cy={point[1]}
            r={2 * scale}
            stroke="black"
          />
        ))}
      </svg>
    );
  }
}

function polygonClip(clip: Point[], subject: Point[]) {
  const closed = polygonClosed(subject);
  const n = clip.length - (polygonClosed(clip) ? 1 : 0);
  subject = subject.slice(); // copy before mutate
  for (let i = 0, a = clip[n - 1], b, c, d; i < n; ++i) {
    const input = subject.slice();
    const m = input.length - (closed ? 1 : 0);
    subject.length = 0;
    b = clip[i];
    c = input[m - 1];
    for (let j = 0; j < m; ++j) {
      d = input[j];
      if (lineOrient(d, a, b)) {
        if (!lineOrient(c, a, b)) {
          subject.push(lineIntersect(c, d, a, b));
        }
        subject.push(d);
      } else if (lineOrient(c, a, b)) {
        subject.push(lineIntersect(c, d, a, b));
      }
      c = d;
    }
    if (closed) subject.push(subject[0]);
    a = b;
  }
  return subject.length ? subject : null;
}

function lineOrient([px, py]: Point, [ax, ay]: Point, [bx, by]: Point) {
  return (bx - ax) * (py - ay) < (by - ay) * (px - ax);
}

function lineIntersect(
  [ax, ay]: Point,
  [bx, by]: Point,
  [cx, cy]: Point,
  [dx, dy]: Point
): Point {
  const bax = bx - ax,
    bay = by - ay,
    dcx = dx - cx,
    dcy = dy - cy;
  const k = (bax * (cy - ay) - bay * (cx - ax)) / (bay * dcx - bax * dcy);
  return [cx + k * dcx, cy + k * dcy];
}

function polygonClosed(points: Point[]) {
  const [ax, ay] = points[0],
    [bx, by] = points[points.length - 1];
  return ax === bx && ay === by;
}
