import { Point } from "./point";

export interface IDraw {
  height: number;
  width: number;

  line(
    start: Point,
    end: Point,
    width: number,
    color: string,
    alpha: number
  ): void;
  polygon(points: Point[], color: string): void;
  polyline(points: Point[], width: number, color: string, alpha: number): void;
  rect(topLeft: Point, w: number, h: number, color: string): void;
}

/*
export class DrawCanvas implements IDraw {
  private context: CanvasRenderingContext2D;
  public height: number;
  public width: number;

  constructor(private canvas: Canvas) {
    this.context = this.canvas.getContext("2d");

    this.height = this.canvas.height;
    this.width = this.canvas.width;
  }

  public rect(topLeft: Point, w: number, h: number, color: string) {
    this.context.save();

    this.context.fillStyle = this.context.strokeStyle = color;
    this.context.fillRect(topLeft.x, topLeft.y, w, h);

    this.context.restore();
  }

  public polygon(points: Point[], color: string) {
    this.context.save();

    this.context.fillStyle = color;
    this.context.strokeStyle = color;

    this.context.beginPath();
    points.forEach(({ x, y }, i) => {
      if (i === 0) {
        this.context.moveTo(x, y);
      } else {
        this.context.lineTo(x, y);
      }
    });
    this.context.closePath();
    this.context.fill();
    this.context.stroke();

    this.context.restore();
  }

  public polyline(
    points: Point[],
    width: number,
    color: string,
    alpha: number
  ) {
    console.error("polyline", points, width, color, alpha);
    throw new Error("not implemented");
  }

  public line(
    start: Point,
    end: Point,
    width: number,
    color: string,
    alpha: number
  ) {
    this.context.save();

    this.context.strokeStyle = color;
    this.context.lineWidth = width;
    this.context.globalAlpha = alpha;

    this.context.beginPath();
    this.context.moveTo(start.x, start.y);
    this.context.lineTo(end.x, end.y);
    this.context.stroke();

    if (1 < width) {
      this.context.fillStyle = color;

      this.context.beginPath();
      this.context.arc(start.x, start.y, width / 2, 0, Math.PI * 2);
      this.context.closePath();
      this.context.fill();

      this.context.beginPath();
      this.context.arc(end.x, end.y, width / 2, 0, Math.PI * 2);
      this.context.closePath();
      this.context.fill();
    }

    this.context.restore();
  }
}
 */
