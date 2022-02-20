import { IDraw } from "./draw";
import { Point } from "./point";

export interface SvgDrawElement {
  type: string;
  props: {};
}

export class SvgDraw implements IDraw {
  public elements: SvgDrawElement[] = [];

  constructor(public width: number, public height: number) {}

  line(start: Point, end: Point, width: number, color: string, alpha: number) {
    this.elements.push({
      type: "line",
      props: {
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y,
        stroke: color,
        strokeWidth: width,
        strokeLinecap: "round",
        opacity: alpha,
      },
    });
  }

  polygon(points: Point[], color: string) {
    this.elements.push({
      type: "polygon",
      props: {
        points: points
          .map(({ x, y }) => `${x},${y}`)
          .reduce((a, b) => `${a} ${b}`, ""),
        fill: color,
        stroke: color,
      },
    });
  }

  polyline(points: Point[], width: number, color: string, alpha: number) {
    this.elements.push({
      type: "polygon",
      props: {
        points: points
          .map(({ x, y }) => `${x},${y}`)
          .reduce((a, b) => `${a} ${b}`, ""),
        fill: "none",
        strokeWidth: width,
        stroke: color,
        strokeLinecap: "round",
        opacity: alpha,
      },
    });
  }

  rect(topLeft: Point, w: number, h: number, color: string) {
    const points = [
      topLeft,
      new Point(topLeft.x + w, topLeft.y),
      new Point(topLeft.x + w, topLeft.y + h),
      new Point(topLeft.x, topLeft.y + h),
    ];

    this.polygon(points, color);
  }

  circle(
    center: Point,
    r: number,
    fill: string,
    stroke: string,
    strokeWidth: number
  ) {
    this.elements.push({
      type: "circle",
      props: {
        cx: center.x,
        cy: center.y,
        r,
        fill,
        stroke,
        strokeWidth,
      },
    });
  }
}
