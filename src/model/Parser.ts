import { Lexer } from "./Lexer";
import { Token } from "./Token";
import { TokenType } from "./TokenType";

export class Parser {
  private token: Token;
  private nextTokens: Token[];
  constructor(private lexer: Lexer) {
    this.token = { type: TokenType.NotSet, value: "" };
    this.nextTokens = [];
  }

  public parse(): any {
    this.nextToken();

    const data: { [key: string]: any } = {};

    while (this.token.type !== TokenType.EOF) {
      const pair = this.parseDictionaryPair();
      data[pair.key] = pair.value;
    }

    return data;
  }

  private parseCollection(): any {
    this.assertTokenType(TokenType.LeftCurly);
    this.nextToken();

    this.loadToken();
    if (this.nextTokens[0].type === TokenType.Equals) {
      const dictionary: { [key: string]: any } = {};
      while (this.token.type !== TokenType.RightCurly) {
        const pair = this.parseDictionaryPair();
        dictionary[pair.key] = pair.value;
      }
      this.nextToken();
      return dictionary;
    } else {
      const list: any[] = [];
      while (this.token.type !== TokenType.RightCurly) {
        list.push(this.parseValue());
      }
      this.nextToken();
      return list;
    }
  }

  private parseDictionaryPair(): { key: string; value: any } {
    const key = this.parseDictionaryKey();

    this.assertTokenType(TokenType.Equals);
    this.nextToken();

    const value = this.parseValue();

    return { key, value };
  }

  private parseDictionaryKey(): string {
    this.assertTokenType(TokenType.Text);
    const value = this.token.value;
    this.nextToken();
    return value;
  }

  private parseValue(): any {
    if (this.token.type == TokenType.Text) {
      const value = this.token.value;
      this.nextToken();
      return value;
    } else if (this.token.type == TokenType.LeftCurly) {
      return this.parseCollection();
    }

    throw new Error(`Unhandled token type ${this.token.type}`);
  }

  private nextToken() {
    if (this.nextTokens.length === 0) {
      this.token = this.lexer.getNextToken();
    } else {
      this.token = this.nextTokens[0];
      this.nextTokens.shift();
    }
  }

  private loadToken() {
    this.nextTokens.push(this.lexer.getNextToken());
  }

  private assertTokenType(type: TokenType) {
    if (this.token.type !== type) {
      throw new Error(
        `Expected token type ${type} but it was ${this.token.type}.`
      );
    }
  }
}
