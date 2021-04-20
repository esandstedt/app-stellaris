import { System, Country } from "@esandstedt/stellaris-model";
import Prando from "prando";

export class Color {
  constructor(public r: number, public g: number, public b: number) {}

  public add(that: Color | number) {
    if (typeof that === "number") {
      return new Color(this.r + that, this.g + that, this.b + that);
    } else {
      return new Color(this.r + that.r, this.g + that.g, this.b + that.b);
    }
  }

  public blend(that: Color, p: number) {
    const q = 1 - p;
    return new Color(
      q * this.r + p * that.r,
      q * this.g + p * that.g,
      q * this.b + p * that.b
    );
  }

  public mult(that: number) {
    return new Color(this.r * that, this.g * that, this.b * that);
  }

  public toString(): string {
    let result = "#";

    const list = [this.r, this.g, this.b];
    for (let i = 0; i < 3; i++) {
      const n = Math.max(0, Math.min(list[i], 255));
      result += Math.round(n).toString(16).padStart(2, "0");
    }

    return result;
  }
}

const countryOffsets: { [id: string]: Color } = {};

const getCountryColorOffset = (country: Country): Color => {
  const { id } = country;

  if (!countryOffsets[id]) {
    const prando = new Prando(id);

    countryOffsets[id] = new Color(
      prando.nextInt(-40, 40),
      prando.nextInt(-40, 40),
      prando.nextInt(-40, 40)
    );
  }

  return countryOffsets[id];
};

export const BLACK = new Color(0, 0, 0);
export const WHITE = new Color(255, 255, 255);

const COLORS: { [key: string]: Color } = {
  blue: new Color(0, 0, 256),
  black: new Color(86, 86, 86),
  brown: new Color(193, 154, 107),
  burgundy: new Color(144, 0, 32),
  dark_blue: new Color(128, 0, 0),
  dark_brown: new Color(107, 68, 35),
  dark_green: new Color(0, 100, 0),
  dark_grey: new Color(128, 128, 128),
  dark_purple: new Color(104, 40, 96),
  dark_teal: new Color(0, 128, 128),
  green: new Color(0, 128, 0),
  grey: new Color(192, 192, 192),
  indigo: new Color(128, 64, 256),
  light_blue: new Color(137, 207, 240),
  light_green: new Color(144, 238, 144),
  light_orange: new Color(256, 196, 128),
  orange: new Color(256, 128, 0),
  pink: new Color(256, 192, 203),
  purple: new Color(128, 0, 128),
  red: new Color(256, 0, 0),
  red_orange: new Color(256, 86, 0),
  teal: new Color(0, 192, 192),
  turquoise: new Color(64, 224, 208),
  yellow: new Color(256, 256, 0),
  white: new Color(0, 0, 0),
};

const getColor = (color: string): Color => {
  if (COLORS[color]) {
    return COLORS[color];
  } else {
    return BLACK;
  }
};

const getCountryColor = (country: Country): Color => {
  const { flag } = country;
  if (flag.colors.length === 0) {
    return BLACK;
  }

  let result: Color;
  if (flag.colors.length === 1) {
    result = getColor(flag.colors[0]);
  } else {
    result = getColor(flag.colors[1]);
  }

  if (result === BLACK) {
    return BLACK;
  }

  result = result.add(getCountryColorOffset(country));

  if (country.overlord) {
    return getCountryColor(country.overlord).blend(BLACK, 0.25);
  } else if (country.alliance) {
    const { leader } = country.alliance;
    if (country !== leader) {
      return getCountryColor(leader);
    }
  }

  return result;
};

export function getSystemController(system: System): Country | undefined {
  return system.planets[0].controller;
}

export function getSystemOwner(system: System): Country | undefined {
  if (system.starbase) {
    return system.starbase.owner;
  } else {
    return undefined;
  }
}

export const getSystemColor = (
  system: System,
  defaultColor: Color = BLACK
): Color => {
  const owner = getSystemOwner(system);
  if (typeof owner !== "undefined") {
    return getCountryColor(owner);
  } else {
    return defaultColor;
  }

  /*
  const owner = getSystemOwner(system);
  const controller = getSystemController(system);

  if (typeof owner !== "undefined" && typeof controller !== "undefined") {
    const o = getCountryColor(owner);
    const c = getCountryColor(controller);
    return o.blend(c, 0.85);
  } else if (typeof owner !== "undefined") {
    return getCountryColor(owner);
  } else if (typeof controller !== "undefined") {
    return getCountryColor(controller);
  } else {
    return defaultColor;
  }
   */
};
