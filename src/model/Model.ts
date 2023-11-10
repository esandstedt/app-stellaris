export class Model {
  public name: string;
  public date: string;
  public galacticObjects: GalacticObject[] = [];
  public countries: Country[] = [];
  public planets: Planet[] = [];
  constructor(public document: any) {
    console.log(document);

    this.name = document.name;
    this.date = document.date;

    for (let key in document.galactic_object) {
      const value = document.galactic_object[key];
      this.galacticObjects.push(new GalacticObject(key, value));
    }

    for (let key in document.planets.planet) {
      const value = document.planets.planet[key];
      if (value === "none") {
        continue;
      }

      const planet = new Planet(key, value);

      const obj = this.galacticObjects.find(
        (x) => x.key == planet._galacticObjectKey
      );
      if (obj) {
        planet.galacticObject = obj;
        obj.planets.push(planet);
      }

      this.planets.push(planet);
    }

    for (let key in document.country) {
      const value = document.country[key];

      if (value === "none") {
        continue;
      }

      const country = new Country(key, value);

      country.controlledPlanets = country._controlledPlanetKeys
        .map((key) => this.planets.find((x) => x.key === key))
        .filter((x) => x) as Planet[];

      this.countries.push(country);
    }

    for (let key in document.pop) {
      const value = document.pop[key];
      const planet = this.planets.find((x) => x.key === value.planet);
      if (planet) {
        planet.popCount += 1;
      }
    }
  }
}

export class GalacticObject {
  public name: string;
  public x: number;
  public y: number;
  public hyperlanes: { to: string; length: number }[];
  public planets: Planet[];
  constructor(public key: string, public document: any) {
    this.name = document.name.key;
    this.x = parseFloat(document.coordinate.x);
    this.y = parseFloat(document.coordinate.y);

    if (document.hyperlane) {
      this.hyperlanes = document.hyperlane.map((x: any) => ({
        to: x.to,
        length: parseInt(x.length, 10),
      }));
    } else {
      this.hyperlanes = [];
    }

    this.planets = [];
  }
}

export class Country {
  public name: string;
  public color: string;
  public _controlledPlanetKeys: string[];
  public controlledPlanets: Planet[];
  public type: string;

  constructor(public key: string, public document: any) {
    this.name = document.name.key;
    this._controlledPlanetKeys = document.controlled_planets || [];
    this.controlledPlanets = [];

    this.color = this.getColor();

    this.type = document.type;
  }

  private getColor(): string {
    const colors = (this.document.flag.colors as string[]).filter(
      (x) => x !== "null"
    );

    return colors.filter((x) => x !== "black")[0] || "black";
  }
}

class Planet {
  public _galacticObjectKey: string;
  public galacticObject: GalacticObject;
  public popCount: number;
  constructor(public key: string, public document: any) {
    this._galacticObjectKey = document.coordinate.origin;
    this.galacticObject = null as any;
    this.popCount = 0;
  }
}
