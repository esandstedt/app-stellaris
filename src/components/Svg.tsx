import * as React from "react";
import { Model } from "@esandstedt/stellaris-model";
//import { saveSvgAsPng } from "save-svg-as-png";

import { IDraw } from "./render/draw";
import { Point } from "./render/point";
import { render } from "./render";

interface Element {
  type: string;
  props: {};
}

class SvgDraw implements IDraw {
  public elements: Element[] = [];

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
}

interface Props {
  model: Model;
  width: number;
  height: number;
}

interface State {
  elements: Element[];
}

export default class Svg extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      elements: [],
    };
  }

  download() {
    //saveSvgAsPng(this.refs.svg, "map.png");
  }

  componentDidMount() {
    const { model, width, height } = this.props;
    const draw = new SvgDraw(width, height);
    render(model, draw);
    this.setState({ elements: draw.elements });
  }

  render() {
    const { width, height } = this.props;
    const { elements } = this.state;
    return (
      <svg ref="svg" width={width} height={height}>
        {elements.map((element, index) => this.renderElement(element, index))}
      </svg>
    );
  }

  private renderElement(element: Element, key: number) {
    const { type, props } = element;
    return React.createElement(type, { key, ...props });
  }
}
