import * as identifer from "./identifer";

/**
 * TypeScriptやJavaScriptのコードを表現する。
 * TypeScriptでも出力できるように型情報をつける必要がある
 */
export type Code = {
  /**
   * 外部に公開する定義
   */
  readonly exportDefinition: ReadonlyArray<Definition>;
  /**
   * 定義した後に実行するコード
   */
  readonly statementList: ReadonlyArray<Statement>;
};

export type Definition =
  | { _: Definition_.TypeAlias; typeAlias: TypeAlias }
  | {
      _: Definition_.Enum;
      enum_: Enum;
    }
  | {
      _: Definition_.Function;
      function_: Function_;
    }
  | {
      _: Definition_.Variable;
      variable: Variable;
    };

export const enum Definition_ {
  TypeAlias,
  Enum,
  Function,
  Variable
}

export const definitionTypeAlias = (typeAlias: TypeAlias): Definition => ({
  _: Definition_.TypeAlias,
  typeAlias
});

export const definitionEnum = (enum_: Enum): Definition => ({
  _: Definition_.Enum,
  enum_
});

export const definitionFunction = (function_: Function_): Definition => ({
  _: Definition_.Function,
  function_
});

export const definitionVariable = (variable: Variable): Definition => ({
  _: Definition_.Variable,
  variable
});

export type TypeAlias = {
  readonly name: identifer.Identifer;
  readonly document: string;
  readonly typeExpr: TypeExpr;
};

export type Function_ = {
  readonly name: identifer.Identifer;
  readonly document: string;
  readonly parameterList: ReadonlyArray<ParameterWithDocument>;
  readonly returnType: TypeExpr;
  readonly statementList: ReadonlyArray<Statement>;
};

export type ParameterWithDocument = {
  readonly name: identifer.Identifer;
  readonly document: string;
  readonly typeExpr: TypeExpr;
};

export type Parameter = {
  name: identifer.Identifer;
  typeExpr: TypeExpr;
};

export type Variable = {
  readonly name: identifer.Identifer;
  readonly document: string;
  readonly typeExpr: TypeExpr;
  readonly expr: Expr;
};

/**
 * 使われている名前, モジュールのパス
 * モジュールの識別子を作るのに使う
 */
export type UsedNameAndModulePath = {
  readonly usedNameSet: Set<identifer.Identifer>;
  readonly modulePathList: Set<string>;
};

export type ModulePathOrName = string & { _modulePathOrName: never };

/**
 * グローバルで使われているものの名前と, モジュールの識別子の辞書
 */
export type ImportedModuleNameIdentiferMap = ReadonlyMap<
  string,
  identifer.Identifer
>;

export const init: UsedNameAndModulePath = {
  usedNameSet: new Set(),
  modulePathList: new Set()
};

export type Enum = {
  readonly name: string;
  readonly document: string;
  readonly tagNameAndValueList: ReadonlyArray<identifer.Identifer>;
};

export type UnaryOperator = "-" | "~" | "!";

export type BinaryOperator =
  | "**"
  | "*"
  | "/"
  | "%"
  | "+"
  | "-"
  | "<<"
  | ">>"
  | ">>>"
  | "<"
  | "<="
  | "==="
  | "!=="
  | "&"
  | "^"
  | "|"
  | "&&"
  | "||";

export type Expr =
  | { _: Expr_.NumberLiteral; value: number }
  | {
      _: Expr_.StringLiteral;
      value: string;
    }
  | {
      _: Expr_.BooleanLiteral;
      value: boolean;
    }
  | {
      _: Expr_.NullLiteral;
    }
  | {
      _: Expr_.UndefinedLiteral;
    }
  | {
      _: Expr_.UnaryOperator;
      operator: UnaryOperator;
      expr: Expr;
    }
  | {
      _: Expr_.BinaryOperator;
      operator: BinaryOperator;
      left: Expr;
      right: Expr;
    }
  | {
      _: Expr_.ConditionalOperator;
      condition: Expr;
      thenExpr: Expr;
      elseExpr: Expr;
    }
  | {
      _: Expr_.ArrayLiteral;
      exprList: ReadonlyArray<Expr>;
    }
  | {
      _: Expr_.ObjectLiteral;
      memberList: Map<string, Expr>;
    }
  | {
      _: Expr_.Lambda;
      parameterList: ReadonlyArray<Parameter>;
      returnType: TypeExpr;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: Expr_.Variable;
      name: string;
    }
  | {
      _: Expr_.ImportedVariable;
      path: string;
      name: string;
    }
  | {
      _: Expr_.Get;
      expr: Expr;
      propertyName: Expr;
    }
  | {
      _: Expr_.Call;
      expr: Expr;
      parameterList: ReadonlyArray<Expr>;
    }
  | {
      _: Expr_.New;
      expr: Expr;
      parameterList: ReadonlyArray<Expr>;
    }
  | {
      _: Expr_.EnumTag;
      typeName: string;
      tagName: string;
    }
  | {
      _: Expr_.BuiltIn;
      builtIn: BuiltInVariable;
    };

export const enum Expr_ {
  NumberLiteral,
  StringLiteral,
  BooleanLiteral,
  UndefinedLiteral,
  NullLiteral,
  ArrayLiteral,
  ObjectLiteral,
  UnaryOperator,
  BinaryOperator,
  ConditionalOperator,
  Lambda,
  Variable,
  ImportedVariable,
  Get,
  Call,
  New,
  EnumTag,
  BuiltIn
}

/**
 * 文
 */
export type Statement =
  | {
      _: Statement_.EvaluateExpr;
      expr: Expr;
    }
  | {
      _: Statement_.Set;
      targetObject: Expr;
      operator: BinaryOperator | null;
      expr: Expr;
    }
  | {
      _: Statement_.If;
      condition: Expr;
      thenStatementList: ReadonlyArray<Statement>;
    }
  | {
      _: Statement_.ThrowError;
      errorMessage: Expr;
    }
  | {
      _: Statement_.Return;
      expr: Expr;
    }
  | {
      _: Statement_.ReturnVoid;
    }
  | {
      _: Statement_.Continue;
    }
  | {
      _: Statement_.VariableDefinition;
      name: string;
      expr: Expr;
      typeExpr: TypeExpr;
      isConst: boolean;
    }
  | {
      _: Statement_.FunctionDefinition;
      name: string;
      parameterList: ReadonlyArray<Parameter>;
      returnType: TypeExpr;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: Statement_.For;
      counterVariableName: string;
      untilExpr: Expr;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: Statement_.ForOf;
      elementVariableName: string;
      iterableExpr: Expr;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: Statement_.WhileTrue;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: Statement_.Break;
    };

export const enum Statement_ {
  EvaluateExpr,
  Set,
  If,
  ThrowError,
  Return,
  ReturnVoid,
  Continue,
  VariableDefinition,
  FunctionDefinition,
  For,
  ForOf,
  WhileTrue,
  Break
}

/**
 * 型を表現する式
 */
export type TypeExpr =
  | { _: TypeExpr_.Number }
  | { _: TypeExpr_.String }
  | { _: TypeExpr_.Boolean }
  | { _: TypeExpr_.Undefined }
  | { _: TypeExpr_.Null }
  | { _: TypeExpr_.Never }
  | { _: TypeExpr_.Void }
  | {
      _: TypeExpr_.Object;
      memberList: Map<string, { typeExpr: TypeExpr; document: string }>;
    }
  | {
      _: TypeExpr_.Function;
      parameterList: ReadonlyArray<TypeExpr>;
      return: TypeExpr;
    }
  | {
      _: TypeExpr_.WithTypeParameter;
      typeExpr: TypeExpr;
      typeParameterList: ReadonlyArray<TypeExpr>;
    }
  | {
      _: TypeExpr_.EnumTagLiteral;
      typeName: string;
      tagName: string;
    }
  | {
      _: TypeExpr_.Union;
      types: ReadonlyArray<TypeExpr>;
    }
  | {
      _: TypeExpr_.ImportedType;
      path: string;
      name: string;
    }
  | { _: TypeExpr_.GlobalType; name: string }
  | { _: TypeExpr_.BuiltIn; builtIn: BuiltInType };

export const enum TypeExpr_ {
  Number,
  String,
  Boolean,
  Undefined,
  Null,
  Never,
  Void,
  Object,
  Function,
  FunctionReturnVoid,
  EnumTagLiteral,
  Union,
  WithTypeParameter,
  ImportedType,
  GlobalType,
  BuiltIn
}

export const enum BuiltInVariable {
  Object,
  Number,
  Math,
  Date,
  Uint8Array,
  Map,
  Set,
  console
}

export const enum BuiltInType {
  Array,
  ReadonlyArray,
  Uint8Array,
  Promise,
  Date,
  Map,
  ReadonlyMap,
  Set,
  ReadonlySet
}

/**
 * 数値リテラル `123`
 * @param value 値
 */
export const numberLiteral = (value: number): Expr => ({
  _: Expr_.NumberLiteral,
  value: value
});

/**
 * 文字列リテラル `"text"`
 * @param string 文字列。エスケープする必要はない
 */
export const stringLiteral = (string: string): Expr => ({
  _: Expr_.StringLiteral,
  value: string
});

/**
 * booleanリテラル
 * @param value trueかfalse
 */
export const booleanLiteral = (value: boolean): Expr => ({
  _: Expr_.BooleanLiteral,
  value
});

/**
 *  undefinedリテラル
 */
export const undefinedLiteral: Expr = {
  _: Expr_.UndefinedLiteral
};

/**
 * nullリテラル
 */
export const nullLiteral: Expr = {
  _: Expr_.NullLiteral
};

/**
 * 単項マイナス演算子 `-a`
 * @param expr 式
 */
export const minus = (expr: Expr): Expr => ({
  _: Expr_.UnaryOperator,
  operator: "-",
  expr
});

/**
 * ビット否定 `~a`
 * @param expr 式
 */
export const bitwiseNot = (expr: Expr): Expr => ({
  _: Expr_.UnaryOperator,
  operator: "~",
  expr
});

/**
 * 論理否定 `!a`
 * @param left 左辺
 * @param right 右辺
 */
export const logicalNot = (expr: Expr): Expr => ({
  _: Expr_.UnaryOperator,
  operator: "!",
  expr
});

/**
 * べき乗 `a ** b`
 * @param left
 * @param right
 */
export const exponentiation = (left: Expr, right: Expr): Expr => ({
  _: Expr_.BinaryOperator,
  operator: "**",
  left,
  right
});

/**
 * 数値の掛け算 `a * b`
 * @param left 左辺
 * @param right 右辺
 */
export const multiplication = (left: Expr, right: Expr): Expr => ({
  _: Expr_.BinaryOperator,
  operator: "*",
  left: left,
  right: right
});

/**
 * 数値の割り算 `a / b`
 * @param left 左辺
 * @param right 右辺
 */
export const division = (left: Expr, right: Expr): Expr => ({
  _: Expr_.BinaryOperator,
  operator: "/",
  left: left,
  right: right
});

/**
 * 剰余演算 `a % b`
 * @param left 左辺
 * @param right 右辺
 */
export const modulo = (left: Expr, right: Expr): Expr => ({
  _: Expr_.BinaryOperator,
  operator: "%",
  left,
  right
});

/**
 * 数値の足し算、文字列の結合 `a + b`
 * @param left 左辺
 * @param right 右辺
 */
export const addition = (left: Expr, right: Expr): Expr => ({
  _: Expr_.BinaryOperator,
  operator: "+",
  left: left,
  right: right
});

/**
 * 数値の引き算 `a - b`
 * @param left 左辺
 * @param right 右辺
 */
export const subtraction = (left: Expr, right: Expr): Expr => ({
  _: Expr_.BinaryOperator,
  operator: "-",
  left: left,
  right: right
});

/**
 * 左シフト `a << b`
 * @param left 左辺
 * @param right 右辺
 */
export const leftShift = (left: Expr, right: Expr): Expr => ({
  _: Expr_.BinaryOperator,
  operator: "<<",
  left,
  right
});

/**
 * 符号を維持する右シフト `a >> b`
 * @param left 左辺
 * @param right 右辺
 */
export const signedRightShift = (left: Expr, right: Expr): Expr => ({
  _: Expr_.BinaryOperator,
  operator: ">>",
  left,
  right
});

/**
 * 符号を維持しない(0埋め)右シフト `a >>> b`
 * @param left 左辺
 * @param right 右辺
 */
export const unsignedRightShift = (left: Expr, right: Expr): Expr => ({
  _: Expr_.BinaryOperator,
  operator: ">>>",
  left,
  right
});

/**
 * 未満 `a < b`
 * @param left 左辺
 * @param right 右辺
 */
export const lessThan = (left: Expr, right: Expr): Expr => ({
  _: Expr_.BinaryOperator,
  operator: "<",
  left,
  right
});

/**
 * 以下 `a <= b`
 * @param left 左辺
 * @param right 右辺
 */
export const lessThanOrEqual = (left: Expr, right: Expr): Expr => ({
  _: Expr_.BinaryOperator,
  operator: "<=",
  left,
  right
});
/**
 * 等号 `a === b`
 * @param left 左辺
 * @param right 右辺
 */
export const equal = (left: Expr, right: Expr): Expr => ({
  _: Expr_.BinaryOperator,
  operator: "===",
  left,
  right
});

/**
 * 不等号 `a !== b`
 * @param left 左辺
 * @param right 右辺
 */
export const notEqual = (left: Expr, right: Expr): Expr => ({
  _: Expr_.BinaryOperator,
  operator: "!==",
  left,
  right
});

/**
 * ビットAND `a & b`
 * @param left 左辺
 * @param right 右辺
 */
export const bitwiseAnd = (left: Expr, right: Expr): Expr => ({
  _: Expr_.BinaryOperator,
  operator: "&",
  left,
  right
});

export const bitwiseXOr = (left: Expr, right: Expr): Expr => ({
  _: Expr_.BinaryOperator,
  operator: "^",
  left,
  right
});

/**
 * ビットOR `a | b`
 * @param left 左辺
 * @param right 右辺
 */
export const bitwiseOr = (left: Expr, right: Expr): Expr => ({
  _: Expr_.BinaryOperator,
  operator: "|",
  left,
  right
});

/**
 * 論理AND `a && b`
 * @param left 左辺
 * @param right 右辺
 */
export const logicalAnd = (left: Expr, right: Expr): Expr => ({
  _: Expr_.BinaryOperator,
  operator: "&&",
  left,
  right
});

/**
 * 論理OR `a || b`
 * @param left 左辺
 * @param right 右辺
 */
export const logicalOr = (left: Expr, right: Expr): Expr => ({
  _: Expr_.BinaryOperator,
  operator: "||",
  left,
  right
});

/**
 * 条件演算子 `a ? b : c`
 * @param condition a
 * @param thenExpr b
 * @param elseExpr c
 */
export const conditionalOperator = (
  condition: Expr,
  thenExpr: Expr,
  elseExpr: Expr
): Expr => ({
  _: Expr_.ConditionalOperator,
  condition,
  thenExpr,
  elseExpr
});

/**
 * 配列リテラル `[1, 2, 3]`
 */
export const arrayLiteral = (exprList: ReadonlyArray<Expr>): Expr => ({
  _: Expr_.ArrayLiteral,
  exprList
});

/**
 * オブジェクトリテラル
 * 順番は保証されないので、副作用の含んだ式を入れないこと
 */
export const objectLiteral = (memberMap: Map<string, Expr>): Expr => {
  return {
    _: Expr_.ObjectLiteral,
    memberList: memberMap
  };
};

/**
 * ラムダ式
 * @param parameter パラメーター
 * @param returnType 戻り値
 * @param statementList 本体
 */
export const lambda = (
  parameterList: ReadonlyArray<Parameter>,
  returnType: TypeExpr,
  statementList: ReadonlyArray<Statement>
): Expr => ({
  _: Expr_.Lambda,
  parameterList,
  returnType,
  statementList
});

/**
 * プロパティの値を取得する
 * @param expr 式
 * @param propertyName プロパティ名の式
 */
export const getByExpr = (expr: Expr, propertyName: Expr): Expr => ({
  _: Expr_.Get,
  expr,
  propertyName
});

/**
 * プロパティの値を取得する。getByExprのシンタックスシュガー
 * @param expr 式
 * @param propertyName プロパティ名
 */
export const get = (expr: Expr, propertyName: string): Expr => ({
  _: Expr_.Get,
  expr,
  propertyName: stringLiteral(propertyName)
});

/**
 * 関数を呼ぶ
 * @param expr 式
 * @param parameterList パラメーターのリスト
 */
export const call = (expr: Expr, parameterList: ReadonlyArray<Expr>): Expr => ({
  _: Expr_.Call,
  expr,
  parameterList
});

/**
 * メソッドを呼ぶ (getとcallのシンタックスシュガー)
 * @param expr
 * @param methodName
 * @param parameterList
 */
export const callMethod = (
  expr: Expr,
  methodName: string,
  parameterList: ReadonlyArray<Expr>
): Expr => call(get(expr, methodName), parameterList);

/**
 * 式からインスタンスを作成する `new Date()`
 * @param expr 式
 * @param parameterList パラメーターのリスト
 */
export const newExpr = (
  expr: Expr,
  parameterList: ReadonlyArray<Expr>
): Expr => ({
  _: Expr_.New,
  expr,
  parameterList
});

/**
 * インポートした変数
 * @param path モジュールのパス
 * @param name 変数名
 */
export const importedVariable = (path: string, name: string): Expr => ({
  _: Expr_.ImportedVariable,
  name,
  path
});

/**
 * 変数
 * @param name 変数名
 */
export const variable = (name: string): Expr => ({
  _: Expr_.Variable,
  name
});

/**
 * 列挙型の値を取得する。`Color.Red`
 * @param typeName 型の名前
 * @param tagName タグの名前
 */
export const enumTag = (typeName: string, tagName: string): Expr => ({
  _: Expr_.EnumTag,
  typeName,
  tagName: tagName
});

/**
 * 標準に入っている変数
 */
export const builtInVariable = (builtIn: BuiltInVariable): Expr => ({
  _: Expr_.BuiltIn,
  builtIn
});

/**
 * expr;
 * 式を評価する
 * @param expr 式
 */
export const evaluateExpr = (expr: Expr): Statement => ({
  _: Statement_.EvaluateExpr,
  expr
});

/**
 * ```ts
 * targetObject[targetPropertyName] = expr;
 * location.href = "https://narumincho.com";
 * array[0] = 30;
 * data = 50;
 * i += 1;
 * ```
 * 代入やプロパティの値を設定する。
 * @param targetObject 代入先の式
 * @param operator 演算子
 * @param expr 式
 */
export const set = (
  targetObject: Expr,
  operator: BinaryOperator | null,
  expr: Expr
): Statement => ({
  _: Statement_.Set,
  targetObject,
  operator,
  expr
});

/**
 * if (condition) { thenStatementList }
 * @param condition 条件式
 * @param thenStatementList 条件が成立したらどうするか
 */
export const ifStatement = (
  condition: Expr,
  thenStatementList: ReadonlyArray<Statement>
): Statement => ({
  _: Statement_.If,
  condition,
  thenStatementList
});

/**
 * throw new Error("エラーメッセージ");
 * @param errorMessage エラーメッセージ
 */
export const throwError = (errorMessage: Expr): Statement => ({
  _: Statement_.ThrowError,
  errorMessage
});

/**
 * return expr;
 * @param expr 関数が返す値
 */
export const returnStatement = (expr: Expr): Statement => ({
  _: Statement_.Return,
  expr
});

/**
 * return;
 * 戻り値がvoidの関数を早く抜ける
 */
export const returnVoidStatement: Statement = {
  _: Statement_.ReturnVoid
};

/**
 * continue
 * forの繰り返しを次に進める
 */
export const continueStatement = (): Statement => ({
  _: Statement_.Continue
});

/**
 * `const a: typeExpr = expr`
 * ローカル変数の定義。変数名は自動で決まる
 * @param name 名前 (出力時には短い名前に変換される。この名前には`!`を使えない)
 * @param typeExpr 型
 * @param expr 式
 */
export const variableDefinition = (
  name: string,
  typeExpr: TypeExpr,
  expr: Expr
): Statement => ({
  _: Statement_.VariableDefinition,
  name,
  expr,
  typeExpr,
  isConst: true
});

/**
 * `let a: typeExpr = expr`
 * 上書きできる変数を定義する
 * @param name 名前
 * @param typeExpr 型
 * @param expr 式
 */
export const letVariableDefinition = (
  name: string,
  typeExpr: TypeExpr,
  expr: Expr
): Statement => ({
  _: Statement_.VariableDefinition,
  name,
  expr,
  typeExpr,
  isConst: false
});

/**
 * `const name = (parameterList): returnType => { statementList }`
 * ローカル関数の定義
 * @param name 名前
 * @param parameterList パラメータ
 * @param returnType 戻り値の型
 * @param statementList 関数本体
 */
export const functionDefinition = (
  name: string,
  parameterList: ReadonlyArray<Parameter>,
  returnType: TypeExpr,
  statementList: ReadonlyArray<Statement>
): Statement => ({
  _: Statement_.FunctionDefinition,
  name,
  parameterList,
  returnType,
  statementList
});

/**
 * ```ts
 * for (let counterVariableName = 0; counterVariableName < untilExpr; counterVariableName += 1) {
 *  statementList
 * }
 * ```
 * @param untilExpr 繰り返す数 + 1
 * @param statementList 繰り返す内容
 */
export const forStatement = (
  counterVariableName: string,
  untilExpr: Expr,
  statementList: ReadonlyArray<Statement>
): Statement => ({
  _: Statement_.For,
  counterVariableName,
  statementList,
  untilExpr
});

/**
 * ```ts
 * for (const elementVariableName of iterableExpr) {
 *  statementList
 * }
 * ```
 */
export const forOfStatement = (
  elementVariableName: string,
  iterableExpr: Expr,
  statementList: ReadonlyArray<Statement>
): Statement => ({
  _: Statement_.ForOf,
  elementVariableName,
  iterableExpr,
  statementList
});

/**
 * while (true) { statementList }
 * @param statementList ループする内容
 */
export const whileTrue = (
  statementList: ReadonlyArray<Statement>
): Statement => ({
  _: Statement_.WhileTrue,
  statementList
});

/**
 * break;
 * whileのループから抜ける
 */
export const breakStatement = (): Statement => ({ _: Statement_.Break });

type Literal =
  | number
  | string
  | boolean
  | undefined
  | null
  | { [key in string]: Expr | Literal };

/**
 * 直接JavaScriptのデータからリテラルを生成する。
 * ただし "_"のキーを持つオブジェクトはこの方法では作れない。`objectLiteral`を使おう
 * @param value
 */
export const literal = (value: Literal): Expr => {
  if (typeof value === "number") {
    return numberLiteral(value);
  }
  if (typeof value === "string") {
    return stringLiteral(value);
  }
  if (typeof value === "boolean") {
    return booleanLiteral(value);
  }
  if (value === undefined) {
    return undefinedLiteral;
  }
  if (value === null) {
    return nullLiteral;
  }
  const objectLiteralMemberMap = new Map<string, Expr>();
  for (const [valueKey, valueValue] of Object.entries(value)) {
    if (typeof valueValue === "number") {
      objectLiteralMemberMap.set(valueKey, numberLiteral(valueValue));
      continue;
    }
    if (typeof valueValue === "string") {
      objectLiteralMemberMap.set(valueKey, stringLiteral(valueValue));
      continue;
    }
    if (typeof valueValue === "boolean") {
      objectLiteralMemberMap.set(valueKey, booleanLiteral(valueValue));
      continue;
    }
    if (valueValue === undefined) {
      objectLiteralMemberMap.set(valueKey, undefinedLiteral);
      continue;
    }
    if (valueValue === null) {
      objectLiteralMemberMap.set(valueKey, nullLiteral);
      continue;
    }
    if (typeof valueValue._ === "number") {
      objectLiteralMemberMap.set(valueKey, valueValue as Expr);
    } else {
      objectLiteralMemberMap.set(valueKey, literal(valueValue as Literal));
    }
  }
  return objectLiteral(objectLiteralMemberMap);
};

/* =======================================================
                      util
   =======================================================
*/

/**
 * ```ts
 * Object.entries(parameter)
 * Object.keys(parameter)
 * ```
 */
export const callObjectMethod = (
  methodName: string,
  parameterList: ReadonlyArray<Expr>
): Expr =>
  callMethod(
    builtInVariable(BuiltInVariable.Object),
    methodName,
    parameterList
  );

/**
 * ```ts
 * Number.parseInt(parameter)
 * Number.isNaN(parameter)
 * ```
 */
export const callNumberMethod = (
  methodName: string,
  parameterList: ReadonlyArray<Expr>
): Expr =>
  callMethod(
    builtInVariable(BuiltInVariable.Number),
    methodName,
    parameterList
  );

/**
 * ```ts
 * Math.floor(parameter)
 * Math.sqrt(parameter)
 * ```
 */
export const callMathMethod = (
  methodName: string,
  parameterList: ReadonlyArray<Expr>
): Expr =>
  callMethod(builtInVariable(BuiltInVariable.Math), methodName, parameterList);

/**
 * ```ts
 * new Date()
 * ```
 */
export const newDate: Expr = newExpr(builtInVariable(BuiltInVariable.Date), []);

/**
 * ```ts
 * new Uint8Array(lengthOrIterable)
 * ```
 */
export const newUint8Array = (lengthOrIterable: Expr): Expr =>
  newExpr(builtInVariable(BuiltInVariable.Uint8Array), [lengthOrIterable]);

/**
 * ```ts
 * new Map(initKeyValueList)
 * ```
 */
export const newMap = (initKeyValueList: Expr): Expr =>
  newExpr(builtInVariable(BuiltInVariable.Map), [initKeyValueList]);

/**
 * ```ts
 * new Set(initValueList)
 * ```
 */
export const newSet = (initValueList: Expr): Expr =>
  newExpr(builtInVariable(BuiltInVariable.Map), [initValueList]);

/**
 * ```ts
 * console.log(expr)
 * ```
 */
export const consoleLog = (expr: Expr): Statement =>
  evaluateExpr(
    callMethod(builtInVariable(BuiltInVariable.console), "log", [expr])
  );

/**
 * プリミティブの型のnumber
 */
export const typeNumber: TypeExpr = {
  _: TypeExpr_.Number
};

/**
 * プリミティブの型のstring
 */
export const typeString: TypeExpr = {
  _: TypeExpr_.String
};

/**
 * プリミティブの型のboolean
 */
export const typeBoolean: TypeExpr = {
  _: TypeExpr_.Boolean
};

/**
 * プリミティブの型のundefined
 */
export const typeUndefined: TypeExpr = {
  _: TypeExpr_.Undefined
};

/**
 * プリミティブの型のnull
 */
export const typeNull: TypeExpr = {
  _: TypeExpr_.Null
};

/**
 * never型
 */
export const typeNever: TypeExpr = {
  _: TypeExpr_.Never
};

/**
 * void型
 */
export const typeVoid: TypeExpr = {
  _: TypeExpr_.Void
};

/**
 * オブジェクト
 */
export const object = (
  memberList: Map<string, { typeExpr: TypeExpr; document: string }>
): TypeExpr => ({
  _: TypeExpr_.Object,
  memberList: memberList
});

/**
 * 関数 `(parameter: parameter) => returnType`
 */
export const functionWithReturn = (
  parameter: ReadonlyArray<TypeExpr>,
  returnType: TypeExpr
): TypeExpr => ({
  _: TypeExpr_.Function,
  parameterList: parameter,
  return: returnType
});

/**
 * Enumのリテラル型 `Color.Red`
 * @param typeName 型の名前 `Color`
 * @param tagName タグの名前 `Red`
 */
export const enumTagLiteral = (
  typeName: string,
  tagName: string
): TypeExpr => ({
  _: TypeExpr_.EnumTagLiteral,
  typeName,
  tagName: tagName
});
/**
 * ユニオン型 `a | b`
 * @param types 型のリスト
 */
export const union = (types: ReadonlyArray<TypeExpr>): TypeExpr => ({
  _: TypeExpr_.Union,
  types
});

/**
 * 型パラメータ付きの型 `Promise<number>` `ReadonlyArray<string>`
 */
export const withTypeParameter = (
  typeExpr: TypeExpr,
  typeParameterList: ReadonlyArray<TypeExpr>
): TypeExpr => ({
  _: TypeExpr_.WithTypeParameter,
  typeExpr,
  typeParameterList
});

/**
 * インポートされた外部の型
 * @param path インポートするモジュールのパス
 * @param name 型名
 */
export const importedType = (path: string, name: string): TypeExpr => ({
  _: TypeExpr_.ImportedType,
  path,
  name
});

/**
 * グローバル空間の型
 * @param name 型名
 */
export const globalType = (name: string): TypeExpr => ({
  _: TypeExpr_.GlobalType,
  name
});

/**
 * 標準に入っている型
 */
const builtInType = (builtIn: BuiltInType): TypeExpr => ({
  _: TypeExpr_.BuiltIn,
  builtIn
});
/* =======================================================
                      util
   =======================================================
*/

/**
 * `Array<elementType>`
 */
export const arrayType = (elementType: TypeExpr): TypeExpr =>
  withTypeParameter(builtInType(BuiltInType.Array), [elementType]);

/**
 * `ReadonlyArray<elementType>`
 */
export const readonlyArrayType = (elementType: TypeExpr): TypeExpr =>
  withTypeParameter(builtInType(BuiltInType.ReadonlyArray), [elementType]);

/**
 * `Uint8Array`
 */
export const uint8ArrayType: TypeExpr = builtInType(BuiltInType.Uint8Array);

/**
 * `Promise<returnType>`
 */
export const promiseType = (returnType: TypeExpr): TypeExpr =>
  withTypeParameter(builtInType(BuiltInType.Promise), [returnType]);

/**
 * `Date`
 */
export const dateType: TypeExpr = builtInType(BuiltInType.Date);

/**
 * `Map<keyType, valueType>`
 */
export const mapType = (keyType: TypeExpr, valueType: TypeExpr): TypeExpr =>
  withTypeParameter(builtInType(BuiltInType.Map), [keyType, valueType]);

/**
 * `ReadonlyMap<keyType, valueType>`
 */
export const readonlyMapType = (
  keyType: TypeExpr,
  valueType: TypeExpr
): TypeExpr =>
  withTypeParameter(builtInType(BuiltInType.ReadonlyMap), [keyType, valueType]);

/**
 * `Set<elementType>`
 */
export const setType = (elementType: TypeExpr): TypeExpr =>
  withTypeParameter(builtInType(BuiltInType.Set), [elementType]);

/**
 * `ReadonlySet<elementType>`
 */
export const readonlySetType = (elementType: TypeExpr): TypeExpr =>
  withTypeParameter(builtInType(BuiltInType.ReadonlySet), [elementType]);
