import * as identifer from "./identifer";

/**
 * TypeScriptやJavaScriptのコードを表現する。
 * TypeScriptでも出力できるように型情報をつける必要がある
 */
export type Code = {
  /**
   * 外部に公開する定義
   */
  readonly exportDefinitionList: ReadonlyArray<Definition>;
  /**
   * 定義した後に実行するコード
   */
  readonly statementList: ReadonlyArray<Statement>;
};

/**
 * 出力するコードの種類
 */
export type CodeType = "JavaScript" | "TypeScript";

export type Definition =
  | { _: "TypeAlias"; typeAlias: TypeAlias }
  | {
      _: "Function";
      function_: Function;
    }
  | {
      _: "Variable";
      variable: Variable;
    };

export const definitionTypeAlias = (typeAlias: TypeAlias): Definition => ({
  _: "TypeAlias",
  typeAlias
});

export const definitionFunction = (function_: Function): Definition => ({
  _: "Function",
  function_
});

export const definitionVariable = (variable: Variable): Definition => ({
  _: "Variable",
  variable
});

export type TypeAlias = {
  readonly name: identifer.Identifer;
  readonly parameterList: ReadonlyArray<identifer.Identifer>;
  readonly document: string;
  readonly type_: Type;
};

export type Function = {
  readonly name: identifer.Identifer;
  readonly document: string;
  readonly typeParameterList: ReadonlyArray<identifer.Identifer>;
  readonly parameterList: ReadonlyArray<ParameterWithDocument>;
  readonly returnType: Type;
  readonly statementList: ReadonlyArray<Statement>;
};

export type ParameterWithDocument = {
  readonly name: identifer.Identifer;
  readonly document: string;
  readonly type_: Type;
};

export type Parameter = {
  name: identifer.Identifer;
  type_: Type;
};

export type Variable = {
  readonly name: identifer.Identifer;
  readonly document: string;
  readonly type_: Type;
  readonly expr: Expr;
};

/**
 * 使われている名前, モジュールのパス
 * モジュールの識別子を作るのに使う
 */
export type UsedNameAndModulePathSet = {
  readonly usedNameSet: Set<identifer.Identifer>;
  readonly modulePathSet: Set<string>;
};

export type ModulePathOrName = string & { _modulePathOrName: never };

/**
 * モジュールの識別子の辞書
 */
export type CollectedData = {
  importedModuleNameIdentiferMap: ReadonlyMap<string, identifer.Identifer>;
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
  | { _: "NumberLiteral"; value: number }
  | {
      _: "StringLiteral";
      value: string;
    }
  | {
      _: "BooleanLiteral";
      value: boolean;
    }
  | {
      _: "NullLiteral";
    }
  | {
      _: "UndefinedLiteral";
    }
  | {
      _: "UnaryOperator";
      operator: UnaryOperator;
      expr: Expr;
    }
  | {
      _: "BinaryOperator";
      operator: BinaryOperator;
      left: Expr;
      right: Expr;
    }
  | {
      _: "ConditionalOperator";
      condition: Expr;
      thenExpr: Expr;
      elseExpr: Expr;
    }
  | {
      _: "ArrayLiteral";
      exprList: ReadonlyArray<Expr>;
    }
  | {
      _: "ObjectLiteral";
      memberList: Map<string, Expr>;
    }
  | {
      _: "Lambda";
      parameterList: ReadonlyArray<Parameter>;
      returnType: Type;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: "Variable";
      name: identifer.Identifer;
    }
  | {
      _: "GlobalObjects";
      name: identifer.Identifer;
    }
  | {
      _: "ImportedVariable";
      moduleName: string;
      name: identifer.Identifer;
    }
  | {
      _: "Get";
      expr: Expr;
      propertyName: Expr;
    }
  | {
      _: "Call";
      expr: Expr;
      parameterList: ReadonlyArray<Expr>;
    }
  | {
      _: "New";
      expr: Expr;
      parameterList: ReadonlyArray<Expr>;
    }
  | {
      _: "TypeAssertion";
      expr: Expr;
      type_: Type;
    };

/**
 * 文
 */
export type Statement =
  | {
      _: "EvaluateExpr";
      expr: Expr;
    }
  | {
      _: "Set";
      targetObject: Expr;
      operator: BinaryOperator | null;
      expr: Expr;
    }
  | {
      _: "If";
      condition: Expr;
      thenStatementList: ReadonlyArray<Statement>;
    }
  | {
      _: "ThrowError";
      errorMessage: Expr;
    }
  | {
      _: "Return";
      expr: Expr;
    }
  | {
      _: "ReturnVoid";
    }
  | {
      _: "Continue";
    }
  | {
      _: "VariableDefinition";
      name: identifer.Identifer;
      expr: Expr;
      type_: Type;
      isConst: boolean;
    }
  | {
      _: "FunctionDefinition";
      functionDefinition: FunctionDefinition;
    }
  | {
      _: "For";
      counterVariableName: identifer.Identifer;
      untilExpr: Expr;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: "ForOf";
      elementVariableName: identifer.Identifer;
      iterableExpr: Expr;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: "WhileTrue";
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: "Break";
    }
  | {
      _: "Switch";
      switch_: Switch;
    };

export type FunctionDefinition = {
  name: identifer.Identifer;
  parameterList: ReadonlyArray<ParameterWithDocument>;
  typeParameterList: ReadonlyArray<identifer.Identifer>;
  returnType: Type;
  statementList: ReadonlyArray<Statement>;
};

export type Switch = {
  expr: Expr;
  patternList: ReadonlyArray<Pattern>;
};

export type Pattern = {
  caseTag: string;
  statementList: ReadonlyArray<Statement>;
};

/**
 * 型を表現する式
 */
export type Type =
  | { _: "Number" }
  | { _: "String" }
  | { _: "Boolean" }
  | { _: "Undefined" }
  | { _: "Null" }
  | { _: "Never" }
  | { _: "Void" }
  | {
      _: "Object";
      memberList: Map<string, { type_: Type; document: string }>;
    }
  | {
      _: "Function";
      parameterList: ReadonlyArray<Type>;
      return: Type;
    }
  | {
      _: "WithTypeParameter";
      type_: Type;
      typeParameterList: ReadonlyArray<Type>;
    }
  | {
      _: "Union";
      types: ReadonlyArray<Type>;
    }
  | {
      _: "ImportedType";
      moduleName: string;
      name: identifer.Identifer;
    }
  | { _: "ScopeInFile"; name: identifer.Identifer }
  | { _: "ScopeInGlobal"; name: identifer.Identifer }
  | { _: "StringLiteral"; string_: string };

/**
 * 数値リテラル `123`
 * @param value 値
 */
export const numberLiteral = (value: number): Expr => ({
  _: "NumberLiteral",
  value: value
});

/**
 * 文字列リテラル `"text"`
 * @param string 文字列。エスケープする必要はない
 */
export const stringLiteral = (string: string): Expr => ({
  _: "StringLiteral",
  value: string
});

/**
 * booleanリテラル
 * @param value trueかfalse
 */
export const booleanLiteral = (value: boolean): Expr => ({
  _: "BooleanLiteral",
  value
});

/**
 *  undefinedリテラル
 */
export const undefinedLiteral: Expr = {
  _: "UndefinedLiteral"
};

/**
 * nullリテラル
 */
export const nullLiteral: Expr = {
  _: "NullLiteral"
};

/**
 * 単項マイナス演算子 `-a`
 * @param expr 式
 */
export const minus = (expr: Expr): Expr => ({
  _: "UnaryOperator",
  operator: "-",
  expr
});

/**
 * ビット否定 `~a`
 * @param expr 式
 */
export const bitwiseNot = (expr: Expr): Expr => ({
  _: "UnaryOperator",
  operator: "~",
  expr
});

/**
 * 論理否定 `!a`
 * @param left 左辺
 * @param right 右辺
 */
export const logicalNot = (expr: Expr): Expr => ({
  _: "UnaryOperator",
  operator: "!",
  expr
});

/**
 * べき乗 `a ** b`
 * @param left
 * @param right
 */
export const exponentiation = (left: Expr, right: Expr): Expr => ({
  _: "BinaryOperator",
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
  _: "BinaryOperator",
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
  _: "BinaryOperator",
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
  _: "BinaryOperator",
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
  _: "BinaryOperator",
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
  _: "BinaryOperator",
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
  _: "BinaryOperator",
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
  _: "BinaryOperator",
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
  _: "BinaryOperator",
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
  _: "BinaryOperator",
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
  _: "BinaryOperator",
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
  _: "BinaryOperator",
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
  _: "BinaryOperator",
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
  _: "BinaryOperator",
  operator: "&",
  left,
  right
});

export const bitwiseXOr = (left: Expr, right: Expr): Expr => ({
  _: "BinaryOperator",
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
  _: "BinaryOperator",
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
  _: "BinaryOperator",
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
  _: "BinaryOperator",
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
  _: "ConditionalOperator",
  condition,
  thenExpr,
  elseExpr
});

/**
 * 配列リテラル `[1, 2, 3]`
 */
export const arrayLiteral = (exprList: ReadonlyArray<Expr>): Expr => ({
  _: "ArrayLiteral",
  exprList
});

/**
 * オブジェクトリテラル
 * 順番は保証されないので、副作用の含んだ式を入れないこと
 */
export const objectLiteral = (memberMap: Map<string, Expr>): Expr => {
  return {
    _: "ObjectLiteral",
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
  returnType: Type,
  statementList: ReadonlyArray<Statement>
): Expr => ({
  _: "Lambda",
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
  _: "Get",
  expr,
  propertyName
});

/**
 * プロパティの値を取得する。getByExprのシンタックスシュガー
 * @param expr 式
 * @param propertyName プロパティ名
 */
export const get = (expr: Expr, propertyName: string): Expr => ({
  _: "Get",
  expr,
  propertyName: stringLiteral(propertyName)
});

/**
 * 関数を呼ぶ
 * @param expr 式
 * @param parameterList パラメーターのリスト
 */
export const call = (expr: Expr, parameterList: ReadonlyArray<Expr>): Expr => ({
  _: "Call",
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
  _: "New",
  expr,
  parameterList
});

export const typeAssertion = (expr: Expr, type_: Type): Expr => ({
  _: "TypeAssertion",
  expr,
  type_
});

/**
 * インポートした変数
 * @param path モジュールのパス
 * @param name 変数名
 */
export const importedVariable = (
  path: string,
  name: identifer.Identifer
): Expr => ({
  _: "ImportedVariable",
  name,
  moduleName: path
});

/**
 * 変数
 * @param name 変数名
 */
export const variable = (name: identifer.Identifer): Expr => ({
  _: "Variable",
  name
});

/**
 * グローバルスコープに展開されたグローバルオブジェクトs windowは使えないので
 * ```ts
 * window.requestAnimationFrame(console.log)
 * ```
 * ではなく
 * ```ts
 * requestAnimationFrame(console.log)
 * ```
 * の用に使う
 */
export const globalObjects = (name: identifer.Identifer): Expr => ({
  _: "GlobalObjects",
  name
});

/**
 * expr;
 * 式を評価する
 * @param expr 式
 */
export const statementEvaluateExpr = (expr: Expr): Statement => ({
  _: "EvaluateExpr",
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
export const statementSet = (
  targetObject: Expr,
  operator: BinaryOperator | null,
  expr: Expr
): Statement => ({
  _: "Set",
  targetObject,
  operator,
  expr
});

/**
 * if (condition) { thenStatementList }
 * @param condition 条件式
 * @param thenStatementList 条件が成立したらどうするか
 */
export const statementIf = (
  condition: Expr,
  thenStatementList: ReadonlyArray<Statement>
): Statement => ({
  _: "If",
  condition,
  thenStatementList
});

/**
 * throw new Error("エラーメッセージ");
 * @param errorMessage エラーメッセージ
 */
export const statementThrowError = (errorMessage: Expr): Statement => ({
  _: "ThrowError",
  errorMessage
});

/**
 * return expr;
 * @param expr 関数が返す値
 */
export const statementReturn = (expr: Expr): Statement => ({
  _: "Return",
  expr
});

/**
 * return;
 * 戻り値がvoidの関数を早く抜ける
 */
export const statementReturnVoid: Statement = {
  _: "ReturnVoid"
};

/**
 * continue
 * forの繰り返しを次に進める
 */
export const statementContinue = (): Statement => ({
  _: "Continue"
});

/**
 * `const a: type_ = expr`
 * ローカル変数の定義。変数名は自動で決まる
 * @param name 名前 (出力時には短い名前に変換される。この名前には`!`を使えない)
 * @param type_ 型
 * @param expr 式
 */
export const statementVariableDefinition = (
  name: identifer.Identifer,
  type_: Type,
  expr: Expr
): Statement => ({
  _: "VariableDefinition",
  name,
  expr,
  type_,
  isConst: true
});

/**
 * `let a: type_ = expr`
 * 上書きできる変数を定義する
 * @param name 名前
 * @param type_ 型
 * @param expr 式
 */
export const statementLetVariableDefinition = (
  name: identifer.Identifer,
  type_: Type,
  expr: Expr
): Statement => ({
  _: "VariableDefinition",
  name,
  expr,
  type_,
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
export const statementFunctionDefinition = (
  functionDefinition: FunctionDefinition
): Statement => ({
  _: "FunctionDefinition",
  functionDefinition
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
export const statementFor = (
  counterVariableName: identifer.Identifer,
  untilExpr: Expr,
  statementList: ReadonlyArray<Statement>
): Statement => ({
  _: "For",
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
export const statementForOf = (
  elementVariableName: identifer.Identifer,
  iterableExpr: Expr,
  statementList: ReadonlyArray<Statement>
): Statement => ({
  _: "ForOf",
  elementVariableName,
  iterableExpr,
  statementList
});

/**
 * while (true) { statementList }
 * @param statementList ループする内容
 */
export const statementWhileTrue = (
  statementList: ReadonlyArray<Statement>
): Statement => ({
  _: "WhileTrue",
  statementList
});

/**
 * break;
 * whileのループから抜ける
 */
export const statementBreak = (): Statement => ({ _: "Break" });

/**
 * switch文
 */
export const statementSwitch = (switch_: Switch): Statement => ({
  _: "Switch",
  switch_
});

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
 * Number.parseInt(parameter)
 * Number.isNaN(parameter)
 * ```
 */
export const callNumberMethod = (
  methodName: string,
  parameterList: ReadonlyArray<Expr>
): Expr =>
  callMethod(
    globalObjects(identifer.fromString("Number")),
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
  callMethod(
    globalObjects(identifer.fromString("Math")),
    methodName,
    parameterList
  );

/**
 * ```ts
 * new Date()
 * ```
 */
export const newDate: Expr = newExpr(
  globalObjects(identifer.fromString("Date")),
  []
);

/**
 * ```ts
 * new Uint8Array(lengthOrIterable)
 * ```
 */
export const newUint8Array = (lengthOrIterable: Expr): Expr =>
  newExpr(globalObjects(identifer.fromString("Uint8Array")), [
    lengthOrIterable
  ]);

/**
 * ```ts
 * new Map(initKeyValueList)
 * ```
 */
export const newMap = (initKeyValueList: Expr): Expr =>
  newExpr(globalObjects(identifer.fromString("Map")), [initKeyValueList]);

/**
 * ```ts
 * new Set(initValueList)
 * ```
 */
export const newSet = (initValueList: Expr): Expr =>
  newExpr(globalObjects(identifer.fromString("Set")), [initValueList]);

/**
 * ```ts
 * console.log(expr)
 * ```
 */
export const consoleLog = (expr: Expr): Statement =>
  statementEvaluateExpr(
    callMethod(globalObjects(identifer.fromString("console")), "log", [expr])
  );

/**
 * プリミティブの型のnumber
 */
export const typeNumber: Type = {
  _: "Number"
};

/**
 * プリミティブの型のstring
 */
export const typeString: Type = {
  _: "String"
};

/**
 * プリミティブの型のboolean
 */
export const typeBoolean: Type = {
  _: "Boolean"
};

/**
 * プリミティブの型のundefined
 */
export const typeUndefined: Type = {
  _: "Undefined"
};

/**
 * プリミティブの型のnull
 */
export const typeNull: Type = {
  _: "Null"
};

/**
 * never型
 */
export const typeNever: Type = {
  _: "Never"
};

/**
 * void型
 */
export const typeVoid: Type = {
  _: "Void"
};

/**
 * オブジェクト
 */
export const typeObject = (
  memberList: Map<string, { type_: Type; document: string }>
): Type => ({
  _: "Object",
  memberList: memberList
});

/**
 * 関数 `(parameter: parameter) => returnType`
 */
export const typeFunction = (
  parameter: ReadonlyArray<Type>,
  returnType: Type
): Type => ({
  _: "Function",
  parameterList: parameter,
  return: returnType
});

/**
 * ユニオン型 `a | b`
 * @param types 型のリスト
 */
export const typeUnion = (types: ReadonlyArray<Type>): Type => ({
  _: "Union",
  types
});

/**
 * 型パラメータ付きの型 `Promise<number>` `ReadonlyArray<string>`
 */
export const typeWithParameter = (
  type_: Type,
  typeParameterList: ReadonlyArray<Type>
): Type => ({
  _: "WithTypeParameter",
  type_,
  typeParameterList
});

/**
 * インポートされた外部の型
 * @param moduleName インポートするモジュールのパス
 * @param name 型名
 */
export const typeImported = (
  moduleName: string,
  name: identifer.Identifer
): Type => ({
  _: "ImportedType",
  moduleName,
  name
});

/**
 * ファイル内で定義された型
 * @param name 型の名前
 */
export const typeScopeInFile = (name: identifer.Identifer): Type => ({
  _: "ScopeInFile",
  name
});

/**
 * グローバル空間の型
 * @param name 型の名前
 */
export const typeScopeInGlobal = (name: identifer.Identifer): Type => ({
  _: "ScopeInGlobal",
  name
});

/**
 * 文字列リテラル型
 */
export const typeStringLiteral = (string_: string): Type => ({
  _: "StringLiteral",
  string_
});
/* =======================================================
                      util
   =======================================================
*/

/**
 * `Array<elementType>`
 */
export const arrayType = (elementType: Type): Type =>
  typeWithParameter(typeScopeInGlobal(identifer.fromString("Array")), [
    elementType
  ]);

/**
 * `ReadonlyArray<elementType>`
 */
export const readonlyArrayType = (elementType: Type): Type =>
  typeWithParameter(typeScopeInGlobal(identifer.fromString("ReadonlyArray")), [
    elementType
  ]);

/**
 * `Uint8Array`
 */
export const uint8ArrayType: Type = typeScopeInGlobal(
  identifer.fromString("Uint8Array")
);

/**
 * `Promise<returnType>`
 */
export const promiseType = (returnType: Type): Type =>
  typeWithParameter(typeScopeInGlobal(identifer.fromString("Promise")), [
    returnType
  ]);

/**
 * `Date`
 */
export const dateType: Type = typeScopeInGlobal(identifer.fromString("Date"));

/**
 * `Map<keyType, valueType>`
 */
export const mapType = (keyType: Type, valueType: Type): Type =>
  typeWithParameter(typeScopeInGlobal(identifer.fromString("Map")), [
    keyType,
    valueType
  ]);

/**
 * `ReadonlyMap<keyType, valueType>`
 */
export const readonlyMapType = (keyType: Type, valueType: Type): Type =>
  typeWithParameter(typeScopeInGlobal(identifer.fromString("ReadonlyMap")), [
    keyType,
    valueType
  ]);

/**
 * `Set<elementType>`
 */
export const setType = (elementType: Type): Type =>
  typeWithParameter(typeScopeInGlobal(identifer.fromString("Set")), [
    elementType
  ]);

/**
 * `ReadonlySet<elementType>`
 */
export const readonlySetType = (elementType: Type): Type =>
  typeWithParameter(typeScopeInGlobal(identifer.fromString("ReadonlySet")), [
    elementType
  ]);
