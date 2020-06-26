import * as a from "util";

/**
 * バイナリと相互変換するための関数
 */
export type Codec<T extends unknown> = {
  readonly encode: (a: T) => ReadonlyArray<number>;
  readonly decode: (
    a: number,
    b: Uint8Array
  ) => { readonly result: T; readonly nextIndex: number };
};

/**
 * Maybe. nullableのようなもの. Elmに標準で定義されているものに変換をするためにデフォルトで用意した
 */
export type Maybe<value extends unknown> =
  | { readonly _: "Just"; readonly value: value }
  | { readonly _: "Nothing" };

/**
 * 成功と失敗を表す型. Elmに標準で定義されているものに変換をするためにデフォルトで用意した
 */
export type Result<ok extends unknown, error extends unknown> =
  | { readonly _: "Ok"; readonly ok: ok }
  | { readonly _: "Error"; readonly error: error };

/**
 * 出力するコードの種類
 */
export type CodeType = "JavaScript" | "TypeScript";

/**
 * TypeScriptやJavaScriptのコードを表現する. TypeScriptでも出力できるように型情報をつける必要がある
 */
export type Code = {
  /**
   * 外部に公開する定義
   */
  readonly exportDefinitionList: ReadonlyArray<ExportDefinition>;
  /**
   * 定義した後に実行するコード
   */
  readonly statementList: ReadonlyArray<Statement>;
};

/**
 * 外部に公開する定義
 */
export type ExportDefinition =
  | { readonly _: "TypeAlias"; readonly typeAlias: TypeAlias }
  | { readonly _: "Function"; readonly function_: Function }
  | { readonly _: "Variable"; readonly variable: Variable };

/**
 * TypeAlias. `export type T = {}`
 */
export type TypeAlias = {};

export type Function = {};

export type Variable = {};

export type Statement = {};

/**
 * -2 147 483 648 ～ 2 147 483 647. 32bit 符号付き整数. JavaScriptのnumberで扱う
 */
export const Int32: {
  /**
   * numberの32bit符号あり整数をSigned Leb128のバイナリに変換する
   */
  readonly codec: Codec<number>;
} = {
  codec: {
    encode: (value: number): ReadonlyArray<number> => {
      value |= 0;
      const result: Array<number> = [];
      while (true) {
        const byte: number = value & 127;
        value >>= 7;
        if (
          (value === 0 && (byte & 64) === 0) ||
          (value === -1 && (byte & 64) !== 0)
        ) {
          result.push(byte);
          return result;
        }
        result.push(byte | 128);
      }
    },
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: number; readonly nextIndex: number } => {
      let result: number = 0;
      let offset: number = 0;
      while (true) {
        const byte: number = binary[index + offset];
        result |= (byte & 127) << (offset * 7);
        offset += 1;
        if ((128 & byte) === 0) {
          if (offset * 7 < 32 && (byte & 64) !== 0) {
            return {
              result: result | (~0 << (offset * 7)),
              nextIndex: index + offset,
            };
          }
          return { result: result, nextIndex: index + offset };
        }
      }
    },
  },
};

/**
 * 文字列. JavaScriptのstringで扱う
 */
export const String: {
  /**
   * stringをUTF-8のバイナリに変換する
   */
  readonly codec: Codec<string>;
} = {
  codec: {
    encode: (value: string): ReadonlyArray<number> => {
      const result: ReadonlyArray<number> = [
        ...new (process === undefined || process.title === "browser"
          ? TextEncoder
          : a.TextEncoder)().encode(value),
      ];
      return Int32.codec.encode(result.length).concat(result);
    },
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: string; readonly nextIndex: number } => {
      const length: {
        readonly result: number;
        readonly nextIndex: number;
      } = Int32.codec.decode(index, binary);
      const nextIndex: number = length.nextIndex + length.result;
      const textBinary: Uint8Array = binary.slice(length.nextIndex, nextIndex);
      const isBrowser: boolean =
        process === undefined || process.title === "browser";
      if (isBrowser) {
        return {
          result: new TextDecoder().decode(textBinary),
          nextIndex: nextIndex,
        };
      }
      return {
        result: new a.TextDecoder().decode(textBinary),
        nextIndex: nextIndex,
      };
    },
  },
};

/**
 * Bool. 真か偽. JavaScriptのbooleanで扱う
 */
export const Bool: {
  /**
   * true: 1, false: 0. (1byte)としてバイナリに変換する
   */
  readonly codec: Codec<boolean>;
} = {
  codec: {
    encode: (value: boolean): ReadonlyArray<number> => [value ? 1 : 0],
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: boolean; readonly nextIndex: number } => ({
      result: binary[index] !== 0,
      nextIndex: index + 1,
    }),
  },
};

/**
 * バイナリ. JavaScriptのUint8Arrayで扱う
 */
export const Binary: {
  /**
   * 最初にバイト数, その次にバイナリそのまま
   */
  readonly codec: Codec<Uint8Array>;
} = {
  codec: {
    encode: (value: Uint8Array): ReadonlyArray<number> =>
      Int32.codec.encode(value.length).concat([...value]),
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: Uint8Array; readonly nextIndex: number } => {
      const length: {
        readonly result: number;
        readonly nextIndex: number;
      } = Int32.codec.decode(index, binary);
      const nextIndex: number = length.nextIndex + length.result;
      return {
        result: binary.slice(length.nextIndex, nextIndex),
        nextIndex: nextIndex,
      };
    },
  },
};

/**
 * リスト. JavaScriptのArrayで扱う
 */
export const List: {
  readonly codec: <element extends unknown>(
    a: Codec<element>
  ) => Codec<ReadonlyArray<element>>;
} = {
  codec: <element extends unknown>(
    elementCodec: Codec<element>
  ): Codec<ReadonlyArray<element>> => ({
    encode: (value: ReadonlyArray<element>): ReadonlyArray<number> => {
      let result: Array<number> = Int32.codec.encode(value.length) as Array<
        number
      >;
      for (const element of value) {
        result = result.concat(elementCodec.encode(element));
      }
      return result;
    },
    decode: (
      index: number,
      binary: Uint8Array
    ): {
      readonly result: ReadonlyArray<element>;
      readonly nextIndex: number;
    } => {
      const lengthResult: {
        readonly result: number;
        readonly nextIndex: number;
      } = Int32.codec.decode(index, binary);
      index = lengthResult.nextIndex;
      const result: Array<element> = [];
      for (let i = 0; i < lengthResult.result; i += 1) {
        const resultAndNextIndex: {
          readonly result: element;
          readonly nextIndex: number;
        } = elementCodec.decode(index, binary);
        result.push(resultAndNextIndex.result);
        index = resultAndNextIndex.nextIndex;
      }
      return { result: result, nextIndex: index };
    },
  }),
};

/**
 * Id
 */
export const Id: {
  /**
   * バイナリに変換する
   */
  readonly codec: Codec<string>;
} = {
  codec: {
    encode: (value: string): ReadonlyArray<number> => {
      const result: Array<number> = [];
      for (let i = 0; i < 16; i += 1) {
        result[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
      }
      return result;
    },
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: string; readonly nextIndex: number } => ({
      result: [...binary.slice(index, index + 16)]
        .map((n: number): string => n.toString(16).padStart(2, "0"))
        .join(""),
      nextIndex: index + 16,
    }),
  },
};

/**
 * Token
 */
export const Token: {
  /**
   * バイナリに変換する
   */
  readonly codec: Codec<string>;
} = {
  codec: {
    encode: (value: string): ReadonlyArray<number> => {
      const result: Array<number> = [];
      for (let i = 0; i < 32; i += 1) {
        result[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
      }
      return result;
    },
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: string; readonly nextIndex: number } => ({
      result: [...binary.slice(index, index + 32)]
        .map((n: number): string => n.toString(16).padStart(2, "0"))
        .join(""),
      nextIndex: index + 32,
    }),
  },
};

/**
 * Maybe. nullableのようなもの. Elmに標準で定義されているものに変換をするためにデフォルトで用意した
 */
export const Maybe: {
  /**
   * 値があるということ
   */
  readonly Just: <value extends unknown>(a: value) => Maybe<value>;
  /**
   * 値がないということ
   */
  readonly Nothing: <value extends unknown>() => Maybe<value>;
  readonly codec: <value extends unknown>(
    a: Codec<value>
  ) => Codec<Maybe<value>>;
} = {
  Just: <value extends unknown>(value: value): Maybe<value> => ({
    _: "Just",
    value: value,
  }),
  Nothing: <value extends unknown>(): Maybe<value> => ({ _: "Nothing" }),
  codec: <value extends unknown>(
    valueCodec: Codec<value>
  ): Codec<Maybe<value>> => ({
    encode: (value: Maybe<value>): ReadonlyArray<number> => {
      switch (value._) {
        case "Just": {
          return [0].concat(valueCodec.encode(value.value));
        }
        case "Nothing": {
          return [1];
        }
      }
    },
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: Maybe<value>; readonly nextIndex: number } => {
      const patternIndex: {
        readonly result: number;
        readonly nextIndex: number;
      } = Int32.codec.decode(index, binary);
      if (patternIndex.result === 0) {
        const result: {
          readonly result: value;
          readonly nextIndex: number;
        } = valueCodec.decode(patternIndex.nextIndex, binary);
        return {
          result: Maybe.Just(result.result),
          nextIndex: result.nextIndex,
        };
      }
      if (patternIndex.result === 1) {
        return { result: Maybe.Nothing(), nextIndex: patternIndex.nextIndex };
      }
      throw new Error("存在しないパターンを指定された 型を更新してください");
    },
  }),
};

/**
 * 成功と失敗を表す型. Elmに標準で定義されているものに変換をするためにデフォルトで用意した
 */
export const Result: {
  /**
   * 成功
   */
  readonly Ok: <ok extends unknown, error extends unknown>(
    a: ok
  ) => Result<ok, error>;
  /**
   * 失敗
   */
  readonly Error: <ok extends unknown, error extends unknown>(
    a: error
  ) => Result<ok, error>;
  readonly codec: <ok extends unknown, error extends unknown>(
    a: Codec<ok>,
    b: Codec<error>
  ) => Codec<Result<ok, error>>;
} = {
  Ok: <ok extends unknown, error extends unknown>(
    ok: ok
  ): Result<ok, error> => ({ _: "Ok", ok: ok }),
  Error: <ok extends unknown, error extends unknown>(
    error: error
  ): Result<ok, error> => ({ _: "Error", error: error }),
  codec: <ok extends unknown, error extends unknown>(
    okCodec: Codec<ok>,
    errorCodec: Codec<error>
  ): Codec<Result<ok, error>> => ({
    encode: (value: Result<ok, error>): ReadonlyArray<number> => {
      switch (value._) {
        case "Ok": {
          return [0].concat(okCodec.encode(value.ok));
        }
        case "Error": {
          return [1].concat(errorCodec.encode(value.error));
        }
      }
    },
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: Result<ok, error>; readonly nextIndex: number } => {
      const patternIndex: {
        readonly result: number;
        readonly nextIndex: number;
      } = Int32.codec.decode(index, binary);
      if (patternIndex.result === 0) {
        const result: {
          readonly result: ok;
          readonly nextIndex: number;
        } = okCodec.decode(patternIndex.nextIndex, binary);
        return {
          result: Result.Ok(result.result),
          nextIndex: result.nextIndex,
        };
      }
      if (patternIndex.result === 1) {
        const result: {
          readonly result: error;
          readonly nextIndex: number;
        } = errorCodec.decode(patternIndex.nextIndex, binary);
        return {
          result: Result.Error(result.result),
          nextIndex: result.nextIndex,
        };
      }
      throw new Error("存在しないパターンを指定された 型を更新してください");
    },
  }),
};

/**
 * 出力するコードの種類
 */
export const CodeType: {
  /**
   * JavaScript
   */
  readonly JavaScript: CodeType;
  /**
   * TypeScript
   */
  readonly TypeScript: CodeType;
  readonly codec: Codec<CodeType>;
} = {
  JavaScript: "JavaScript",
  TypeScript: "TypeScript",
  codec: {
    encode: (value: CodeType): ReadonlyArray<number> => {
      switch (value) {
        case "JavaScript": {
          return [0];
        }
        case "TypeScript": {
          return [1];
        }
      }
    },
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: CodeType; readonly nextIndex: number } => {
      const patternIndex: {
        readonly result: number;
        readonly nextIndex: number;
      } = Int32.codec.decode(index, binary);
      if (patternIndex.result === 0) {
        return {
          result: CodeType.JavaScript,
          nextIndex: patternIndex.nextIndex,
        };
      }
      if (patternIndex.result === 1) {
        return {
          result: CodeType.TypeScript,
          nextIndex: patternIndex.nextIndex,
        };
      }
      throw new Error("存在しないパターンを指定された 型を更新してください");
    },
  },
};

/**
 * TypeScriptやJavaScriptのコードを表現する. TypeScriptでも出力できるように型情報をつける必要がある
 */
export const Code: { readonly codec: Codec<Code> } = {
  codec: {
    encode: (value: Code): ReadonlyArray<number> =>
      List.codec(ExportDefinition.codec)
        .encode(value.exportDefinitionList)
        .concat(List.codec(Statement.codec).encode(value.statementList)),
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: Code; readonly nextIndex: number } => {
      const exportDefinitionListAndNextIndex: {
        readonly result: ReadonlyArray<ExportDefinition>;
        readonly nextIndex: number;
      } = List.codec(ExportDefinition.codec).decode(index, binary);
      const statementListAndNextIndex: {
        readonly result: ReadonlyArray<Statement>;
        readonly nextIndex: number;
      } = List.codec(Statement.codec).decode(
        exportDefinitionListAndNextIndex.nextIndex,
        binary
      );
      return {
        result: {
          exportDefinitionList: exportDefinitionListAndNextIndex.result,
          statementList: statementListAndNextIndex.result,
        },
        nextIndex: statementListAndNextIndex.nextIndex,
      };
    },
  },
};

/**
 * 外部に公開する定義
 */
export const ExportDefinition: {
  /**
   * TypeAlias. `export type T = {}`
   */
  readonly TypeAlias: (a: TypeAlias) => ExportDefinition;
  /**
   * Function `export const f = () => {}`
   */
  readonly Function: (a: Function) => ExportDefinition;
  /**
   * Variable `export const v = {}`
   */
  readonly Variable: (a: Variable) => ExportDefinition;
  readonly codec: Codec<ExportDefinition>;
} = {
  TypeAlias: (typeAlias: TypeAlias): ExportDefinition => ({
    _: "TypeAlias",
    typeAlias: typeAlias,
  }),
  Function: (function_: Function): ExportDefinition => ({
    _: "Function",
    function_: function_,
  }),
  Variable: (variable: Variable): ExportDefinition => ({
    _: "Variable",
    variable: variable,
  }),
  codec: {
    encode: (value: ExportDefinition): ReadonlyArray<number> => {
      switch (value._) {
        case "TypeAlias": {
          return [0].concat(TypeAlias.codec.encode(value.typeAlias));
        }
        case "Function": {
          return [1].concat(Function.codec.encode(value.function_));
        }
        case "Variable": {
          return [2].concat(Variable.codec.encode(value.variable));
        }
      }
    },
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: ExportDefinition; readonly nextIndex: number } => {
      const patternIndex: {
        readonly result: number;
        readonly nextIndex: number;
      } = Int32.codec.decode(index, binary);
      if (patternIndex.result === 0) {
        const result: {
          readonly result: TypeAlias;
          readonly nextIndex: number;
        } = TypeAlias.codec.decode(patternIndex.nextIndex, binary);
        return {
          result: ExportDefinition.TypeAlias(result.result),
          nextIndex: result.nextIndex,
        };
      }
      if (patternIndex.result === 1) {
        const result: {
          readonly result: Function;
          readonly nextIndex: number;
        } = Function.codec.decode(patternIndex.nextIndex, binary);
        return {
          result: ExportDefinition.Function(result.result),
          nextIndex: result.nextIndex,
        };
      }
      if (patternIndex.result === 2) {
        const result: {
          readonly result: Variable;
          readonly nextIndex: number;
        } = Variable.codec.decode(patternIndex.nextIndex, binary);
        return {
          result: ExportDefinition.Variable(result.result),
          nextIndex: result.nextIndex,
        };
      }
      throw new Error("存在しないパターンを指定された 型を更新してください");
    },
  },
};

/**
 * TypeAlias. `export type T = {}`
 */
export const TypeAlias: { readonly codec: Codec<TypeAlias> } = {
  codec: {
    encode: (value: TypeAlias): ReadonlyArray<number> => [],
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: TypeAlias; readonly nextIndex: number } => ({
      result: {},
      nextIndex: index,
    }),
  },
};

export const Function: { readonly codec: Codec<Function> } = {
  codec: {
    encode: (value: Function): ReadonlyArray<number> => [],
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: Function; readonly nextIndex: number } => ({
      result: {},
      nextIndex: index,
    }),
  },
};

export const Variable: { readonly codec: Codec<Variable> } = {
  codec: {
    encode: (value: Variable): ReadonlyArray<number> => [],
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: Variable; readonly nextIndex: number } => ({
      result: {},
      nextIndex: index,
    }),
  },
};

export const Statement: { readonly codec: Codec<Statement> } = {
  codec: {
    encode: (value: Statement): ReadonlyArray<number> => [],
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: Statement; readonly nextIndex: number } => ({
      result: {},
      nextIndex: index,
    }),
  },
};
