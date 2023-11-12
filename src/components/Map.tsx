import React, { createRef } from "react";
import * as d3 from "d3";
import { Country, GalacticObject, Model } from "@/model/Model";
import { SvgPanZoom } from "./SvgPanZoom";
import { saveSvgAsPng } from "save-svg-as-png";
import { Button } from "./Button";

interface Node {
  object: GalacticObject;
  point: Point;
}

function onlyUnique<T>(value: T, index: number, array: T[]) {
  return array.indexOf(value) === index;
}

const SVG_WIDTH = 4000;
const SVG_HEIGHT = 4000;

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
  frog_green: "#00a693",
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
    .force("link", d3.forceLink(links).distance(10).strength(1.5))
    .force("collide", d3.forceCollide().radius(7).strength(1))
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
        .map((x) => x.galacticObject)
        .filter(onlyUnique)
        .forEach((obj) => {
          if (obj.key) {
            if (result[obj.key]) {
              result[obj.key].push(country);
            } else {
              result[obj.key] = [country];
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
  onClose: () => void;
}

interface State {
  controllers: { [key: string]: Country[] };
  nodes: Node[];
}

export class Map extends React.Component<Props, State> {
  private svgRef = createRef<SVGSVGElement>();

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

    const voronoi = d3.Delaunay.from(points).voronoi([
      -1000, -1000, 1000, 1000,
    ]);

    const nodes = objects.map((object, index) => {
      const point = points[index];
      const centroid = d3.polygonCentroid(
        intersection(circle(point, 20), voronoi.cellPolygon(index))
      );

      return {
        object,
        point: centroid,
      };
    });

    this.setState({
      controllers: getControllers(model),
      nodes,
    });
  }

  private renderSvgContents() {
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
      SVG_WIDTH,
      SVG_HEIGHT
    );

    const scaledNodes = nodes.map<Node>(({ object, point }) => ({
      object,
      point: [
        -scale * point[0] + SVG_WIDTH / 2,
        scale * point[1] + SVG_HEIGHT / 2,
      ],
    }));

    const getPolygon = (() => {
      const voronoi = d3.Delaunay.from(
        scaledNodes.map(({ point }) => point)
      ).voronoi([-SVG_WIDTH, -SVG_HEIGHT, SVG_WIDTH, SVG_HEIGHT]);

      return (node: Node): Point[] => {
        const index = scaledNodes.indexOf(node);
        return intersection(
          circle(node.point, scale * 15),
          voronoi.cellPolygon(index)
        );
      };
    })();

    var maxPopCount = this.props.model.galacticObjects
      .map((obj) =>
        obj.planets.map((p) => p.popCount).reduce((a, b) => a + b, 0)
      )
      .reduce((a, b) => Math.max(a, b), 0);

    const scaledNodeEdges: { from: Node; to: Node }[] = edges
      .map(({ from, to }) => ({
        from: scaledNodes.find((n) => n.object.key == from),
        to: scaledNodes.find((n) => n.object.key == to),
      }))
      .filter(({ from, to }) => from && to) as any;

    return (
      <>
        {/* BACKGROUND */}
        <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="white" />

        {/* GRAY CELLS */}
        {scaledNodes.map((node, i) => (
          <polygon
            key={i}
            fill="#e2e8f0"
            points={polygonPoints(getPolygon(node))}
          />
        ))}

        {/* GRAY HYPERLANE BACKGROUNDS */}
        {scaledNodeEdges.map(({ from, to }, index) => {
          const pf = from.point;
          const pt = to.point;

          return (
            <line
              key={`${from}-${to}-${index}`}
              x1={pf[0]}
              y1={pf[1]}
              x2={pt[0]}
              y2={pt[1]}
              stroke="#e2e8f0"
              strokeWidth={5 * scale}
            />
          );
        })}

        {/* COLORED HYPERLANE BACKGROUNDS */}
        {scaledNodeEdges.map(({ from, to }, index) => {
          const pf = from.point;
          const pt = to.point;

          const cf = controllers[from.object.key] || [];
          const ct = controllers[to.object.key] || [];

          let color = "#e2e8f0";
          if (cf.length === 1 && ct.length === 1 && cf[0].key === ct[0].key) {
            color = mapColor(cf[0].color);
            return (
              <line
                key={`${from}-${to}-${index}`}
                x1={pf[0]}
                y1={pf[1]}
                x2={pt[0]}
                y2={pt[1]}
                stroke={color}
                strokeWidth={4 * scale}
              />
            );
          } else {
            return null;
          }
        })}

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
              strokeWidth={0.5 * scale}
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
              strokeWidth={0.5 * scale}
              strokeOpacity={0.75}
            />
          );
        })}

        {/* SYSTEM POINTS */}
        {scaledNodes.map(({ object, point }, index) => {
          const popCount = object.planets
            .map((x) => x.popCount)
            .reduce((a, b) => a + b, 0);

          const radius = popCount === 0 ? 1 : (4 * popCount) / maxPopCount + 2;

          return (
            <circle
              key={object.key}
              cx={point[0]}
              cy={point[1]}
              r={radius * scale}
              fill="#0f172a"
            />
          );
        })}
      </>
    );
  }

  private renderSvg() {
    return (
      <svg
        ref={this.svgRef}
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      >
        {this.renderSvgContents()}
      </svg>
    );
  }

  public render() {
    const svg = this.renderSvg();
    return (
      <>
        <div className="fixed top-0 mt-4 right-0 mr-4 z-10 flex gap-2">
          <Button onClick={() => this.download()} icon="download" />
          <Button onClick={() => this.props.onClose()} icon="close" />
        </div>
        <SvgPanZoom svg={svg} />
        <div className="hidden">{svg}</div>
      </>
    );
  }

  private download() {
    const element = this.svgRef.current;
    if (element) {
      const { name, date } = this.props.model;
      const fileName = `${name} ${date}.png`.replace(/\s/g, "_");
      saveSvgAsPng(element, fileName);
    }
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
