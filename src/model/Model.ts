export class Model {
  public galacticObjects: GalacticObject[] = [];
  public countries: Country[] = [];
  public planets: Planet[] = [];
  constructor(public document: any) {
    for (let key in document.galactic_object) {
      const value = document.galactic_object[key];
      this.galacticObjects.push(new GalacticObject(key, value));
    }

    for (let key in document.country) {
      const value = document.country[key];
      if (value !== "none") {
        this.countries.push(new Country(key, value));
      }
    }
    for (let key in document.planets.planet) {
      const value = document.planets.planet[key];
      if (value !== "none") {
        this.planets.push(new Planet(key, value));
      }
    }
  }
}

class GalacticObject {
  public name: string;
  public x: number;
  public y: number;
  public hyperlanes: { to: string; length: number }[];
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
  }
}

class Country {
  public name: string;
  public color: string;
  public controlledPlanets: string[];
  public type: string;
  constructor(public key: string, public document: any) {
    this.name = document.name.key;
    this.controlledPlanets = document.controlled_planets;

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
  public galacticObject: string;
  constructor(public key: string, public document: any) {
    try {
      this.galacticObject = document.coordinate.origin;
    } catch (error) {
      console.log(document);
      throw error;
    }
  }
}
