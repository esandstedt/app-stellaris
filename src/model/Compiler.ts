import { loadAsync } from "jszip";
import { Model } from "./Model";
import { Lexer } from "./Lexer";
import { Parser } from "./Parser";

export interface Compilation {
  model: Model;
  document: any;
}

export class Compiler {
  public async load(raw: string | Buffer): Promise<Model> {
    const zip = await loadAsync(raw);
    if (!zip.files.gamestate) {
      throw new Error("Could not find 'gamestate' in the zip file.");
    }

    const text = await zip.files.gamestate.async("text");
    const document = new Parser(new Lexer(text)).parse();
    return new Model(document);
  }
}
