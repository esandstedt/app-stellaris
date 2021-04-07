export class Point {
  constructor(public x: number, public y: number) {}

  public distance(that: Point) {
    return Math.sqrt(
      Math.pow(this.x - that.x, 2) + Math.pow(this.y - that.y, 2)
    );
  }

  public add(that: Point) {
    return new Point(this.x + that.x, this.y + that.y);
  }

  public mult(n: number) {
    return new Point(n * this.x, n * this.y);
  }
}
