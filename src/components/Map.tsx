import { Country, GalacticObject, Model } from "@/model/Model";
import React from "react";
import * as d3 from "d3";

interface Node {
  object: GalacticObject;
  point: Point;
}

function onlyUnique<T>(value: T, index: number, array: T[]) {
  return array.indexOf(value) === index;
}

const COLORS: { [key: string]: string } = {
  black: "#404040",
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

function forceSimulation(points: Point[], edges: [number, number][]): Point[] {
  const nodes = points.map((point) => ({ p: point, x: point[0], y: point[1] }));
  const links = edges.map((edge) => ({ source: edge[0], target: edge[1] }));

  const simulation = d3
    .forceSimulation(nodes)
    .force("link", d3.forceLink(links).distance(10).strength(2))
    .force("collide", d3.forceCollide().radius(20).strength(0.1))
    .force("x", d3.forceX((node) => (node as any).p[0]).strength(1))
    .force("y", d3.forceY((node) => (node as any).p[1]).strength(1));

  for (let i = 0; i < 100; i++) {
    simulation.tick();
  }
  simulation.stop();

  return nodes.map(({ x, y }) => [x, y]);
}

function getControllers(model: Model): { [key: string]: Country[] } {
  const result: { [key: string]: Country[] } = {};
  model.countries
    .filter(
      (x) =>
        x.type === "default" ||
        x.type === "caravaneer_home" ||
        x.type === "dormant_marauders" ||
        x.type === "fallen_empire"
    )
    .forEach((country) => {
      country.controlledPlanets
        .map((x) => model.planets.find((y) => y.key === x)?.galacticObject)
        .filter(onlyUnique)
        .forEach((key) => {
          if (key) {
            if (result[key]) {
              result[key].push(country);
            } else {
              result[key] = [country];
            }
          }
        });
    });
  return result;
}

function getScale(
  points: Point[],
  center: Point,
  width: number,
  height: number
) {
  const ex = width / 2;
  const ey = height / 2;

  if (!points.length) {
    return 1.0;
  }

  let mx = 0;
  let my = 0;
  points.forEach((p) => {
    mx = Math.max(mx, Math.abs(center[0] - p[0]));
    my = Math.max(my, Math.abs(center[1] - p[1]));
  });

  const rx = (0.85 * ex) / mx;
  const ry = (0.85 * ey) / my;

  return Math.min(rx, ry);
}

function circle(point: Point, radius: number): Point[] {
  const result: Point[] = [];
  for (var i = 360; i > 0; i -= 15) {
    result.push([
      point[0] + radius * Math.cos((i * Math.PI) / 180),
      point[1] + radius * Math.sin((i * Math.PI) / 180),
    ]);
  }
  return result;
}

function intersection(a: Point[], b: Point[]): Point[] {
  try {
    return polygonClip(a, b) || [];
  } catch (error) {
    console.error({
      message: "Could not calculate intersection",
      a,
      b,
    });
    throw error;
  }
}

function polygonPoints(points: Point[]): string {
  return points.map((p) => `${p[0]},${p[1]}`).join(" ");
}

type Point = [number, number];

interface Props {
  model: Model;
  width: number;
  height: number;
}

interface State {
  controllers: { [key: string]: Country[] };
  nodes: Node[];
}

export class Map extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      controllers: {},
      nodes: [],
    };
  }

  componentDidMount(): void {
    const { model } = this.props;
    const objects = model.galacticObjects;

    const points = forceSimulation(
      objects.map((obj) => [obj.x, obj.y]),
      objects
        .map(({ key, hyperlanes }) =>
          hyperlanes
            .filter(({ to }) => key < to)
            .map<[number, number]>(({ to }) => [
              objects.findIndex((x) => x.key === key),
              objects.findIndex((x) => x.key === to),
            ])
        )
        .reduce((a, b) => a.concat(b))
    );

    this.setState({
      controllers: getControllers(model),
      nodes: objects.map((object, index) => ({ object, point: points[index] })),
    });
  }

  render() {
    const { width, height } = this.props;
    const { controllers, nodes } = this.state;

    const edges = nodes
      .map(({ object }) =>
        object.hyperlanes.map(({ to }) => ({ from: object.key, to }))
      )
      .reduce((prev, cur) => prev.concat(cur), [])
      .filter(({ from, to }) => from < to);

    const scale = getScale(
      this.state.nodes.map(({ point }) => point),
      [0, 0],
      this.props.width,
      this.props.height
    );

    const scaledNodes = nodes.map<Node>(({ object, point }) => ({
      object,
      point: [-scale * point[0], scale * point[1]],
    }));

    const getPolygon = (() => {
      const delaunay = d3.Delaunay.from(scaledNodes.map(({ point }) => point));
      const voronoi = delaunay.voronoi([-width, -height, width, height]);

      return (node: Node): Point[] => {
        const index = scaledNodes.indexOf(node);
        return intersection(
          circle(node.point, scale * 20),
          voronoi.cellPolygon(index)
        );
      };
    })();

    return (
      <svg
        width={width}
        height={height}
        viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
      >
        {/* GRAY CELLS */}
        {scaledNodes.map((node, i) => (
          <polygon
            key={i}
            fill="#e2e8f0"
            points={polygonPoints(getPolygon(node))}
          />
        ))}

        {/* COLORED CELLS */}
        {scaledNodes.map((node, i) => {
          const countries = controllers[node.object.key] || [];

          if (countries.length === 0) {
            return null;
          }

          let fill = "#334155";
          if (countries.length === 1) {
            const country = countries[0];
            if (country) {
              fill = mapColor(country.color);
            }
          }

          return (
            <polygon
              key={i}
              strokeWidth={1 * scale}
              stroke="#e2e8f0"
              fill={fill}
              points={polygonPoints(getPolygon(node))}
            />
          );
        })}

        {/* HYPERLANES */}
        {edges.map(({ from, to }, index) => {
          const pf = scaledNodes.find((n) => n.object.key == from)?.point;
          const pt = scaledNodes.find((n) => n.object.key == to)?.point;

          if (!pf || !pt) {
            return null;
          }

          return (
            <line
              key={`${from}-${to}-${index}`}
              x1={pf[0]}
              y1={pf[1]}
              x2={pt[0]}
              y2={pt[1]}
              stroke="#0f172a"
              strokeWidth={1 * scale}
              opacity={0.25}
            />
          );
        })}

        {/* SYSTEM POINTS */}
        {scaledNodes.map(({ object, point }) => (
          <circle
            key={object.key}
            cx={point[0]}
            cy={point[1]}
            r={2 * scale}
            fill="#0f172a"
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
