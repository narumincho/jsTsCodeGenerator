import * as identifer from "../identifer";
import * as type from "../type";
import * as typeExpr from "./typeExpr";
import * as namedExpr from "../namedTree/expr";
import * as namedTypeExpr from "../namedTree/typeExpr";

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
      operator: type.UnaryOperator;
      expr: Expr;
    }
  | {
      _: Expr_.BinaryOperator;
      operator: type.BinaryOperator;
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
      _: Expr_.LambdaWithReturn;
      parameterList: ReadonlyArray<{
        name: ReadonlyArray<string>;
        typeExpr: typeExpr.TypeExpr;
      }>;
      returnType: typeExpr.TypeExpr;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: Expr_.LambdaReturnVoid;
      parameterList: ReadonlyArray<{
        name: ReadonlyArray<string>;
        typeExpr: typeExpr.TypeExpr;
      }>;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: Expr_.GlobalVariable;
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
      _: Expr_.LocalVariable;
      name: ReadonlyArray<string>;
    }
  | {
      _: Expr_.EnumTag;
      typeName: string;
      tagName: string;
    };

const enum Expr_ {
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
  LambdaWithReturn,
  LambdaReturnVoid,
  GlobalVariable,
  ImportedVariable,
  Get,
  Call,
  New,
  LocalVariable,
  EnumTag
}

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
 * 戻り値のあるラムダ式
 * @param parameter パラメーター
 * @param returnType 戻り値
 * @param statementList 本体
 */
export const lambdaWithReturn = (
  parameterList: ReadonlyArray<{
    name: ReadonlyArray<string>;
    typeExpr: typeExpr.TypeExpr;
  }>,
  returnType: typeExpr.TypeExpr,
  statementList: ReadonlyArray<Statement>
): Expr => ({
  _: Expr_.LambdaWithReturn,
  parameterList,
  returnType,
  statementList
});

/**
 * 戻り値のないラムダ式
 * @param parameter パラメーター
 * @param statementList 本体
 */
export const lambdaReturnVoid = (
  parameterList: ReadonlyArray<{
    name: ReadonlyArray<string>;
    typeExpr: typeExpr.TypeExpr;
  }>,
  statementList: ReadonlyArray<Statement>
): Expr => ({
  _: Expr_.LambdaReturnVoid,
  parameterList,
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
 * グローバル空間にある変数
 * @param name 変数名
 */
export const globalVariable = (name: string): Expr => ({
  _: Expr_.GlobalVariable,
  name
});

/**
 * ローカル変数
 * @param name 名前 (出力時には短い名前に変換される)
 */
export const localVariable = (name: ReadonlyArray<string>): Expr => ({
  _: Expr_.LocalVariable,
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
      operator: type.BinaryOperator | null;
      expr: Expr;
    }
  | {
      _: Statement_.If;
      condition: Expr;
      thenStatementList: ReadonlyArray<Statement>;
    }
  | {
      _: Statement_.ThrowError;
      errorMessage: string;
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
      name: ReadonlyArray<string>;
      expr: Expr;
      typeExpr: typeExpr.TypeExpr;
      isConst: boolean;
    }
  | {
      _: Statement_.FunctionWithReturnValueVariableDefinition;
      name: ReadonlyArray<string>;
      parameterList: ReadonlyArray<{
        name: ReadonlyArray<string>;
        typeExpr: typeExpr.TypeExpr;
      }>;
      returnType: typeExpr.TypeExpr;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: Statement_.ReturnVoidFunctionVariableDefinition;
      name: ReadonlyArray<string>;
      parameterList: ReadonlyArray<{
        name: ReadonlyArray<string>;
        typeExpr: typeExpr.TypeExpr;
      }>;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: Statement_.For;
      counterVariableName: ReadonlyArray<string>;
      untilExpr: Expr;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: Statement_.ForOf;
      elementVariableName: ReadonlyArray<string>;
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

const enum Statement_ {
  EvaluateExpr,
  Set,
  If,
  ThrowError,
  Return,
  ReturnVoid,
  Continue,
  VariableDefinition,
  FunctionWithReturnValueVariableDefinition,
  ReturnVoidFunctionVariableDefinition,
  For,
  ForOf,
  WhileTrue,
  Break
}

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
  operator: type.BinaryOperator | null,
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
export const throwError = (errorMessage: string): Statement => ({
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
  name: ReadonlyArray<string>,
  typeExpr: typeExpr.TypeExpr,
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
  name: ReadonlyArray<string>,
  typeExpr: typeExpr.TypeExpr,
  expr: Expr
): Statement => ({
  _: Statement_.VariableDefinition,
  name,
  expr,
  typeExpr,
  isConst: false
});

/**
 * `const a = (parameterList): returnType => { statementList }`
 * ローカル関数の定義
 * @param name 名前 (出力時には短い名前に変換される。この名前には`!`を使えない)
 * @param parameterList パラメータ
 * @param returnType 戻り値の型
 * @param statementList 関数本体
 */
export const functionWithReturnValueVariableDefinition = (
  name: ReadonlyArray<string>,
  parameterList: ReadonlyArray<{
    name: ReadonlyArray<string>;
    typeExpr: typeExpr.TypeExpr;
  }>,
  returnType: typeExpr.TypeExpr,
  statementList: ReadonlyArray<Statement>
): Statement => ({
  _: Statement_.FunctionWithReturnValueVariableDefinition,
  name,
  parameterList,
  returnType,
  statementList
});

/**
 * const a = (parameterList): void => { statementList }
 * 戻り値がないローカル関数の定義
 * @param name 名前(出力時には短い名前に変換される)
 * @param parameterList パラメータ
 * @param statementList 関数本体
 */
export const returnVoidFunctionVariableDefinition = (
  name: ReadonlyArray<string>,
  parameterList: ReadonlyArray<{
    name: ReadonlyArray<string>;
    typeExpr: typeExpr.TypeExpr;
  }>,
  statementList: ReadonlyArray<Statement>
): Statement => ({
  _: Statement_.ReturnVoidFunctionVariableDefinition,
  name,
  parameterList,
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
  counterVariableName: ReadonlyArray<string>,
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
  elementVariableName: ReadonlyArray<string>,
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

/**
 * 名前をつけたり、するために式を走査する
 * @param expr 式
 * @param scanData グローバルで使われている名前の集合などのコード全体の情報の収集データ。上書きする
 */
export const scanGlobalVariableNameAndImportedPathInExpr = (
  expr: Expr,
  scanData: type.ScanData
): void => {
  switch (expr._) {
    case Expr_.NumberLiteral:
    case Expr_.UnaryOperator:
    case Expr_.StringLiteral:
    case Expr_.BooleanLiteral:
    case Expr_.UndefinedLiteral:
    case Expr_.NullLiteral:
    case Expr_.EnumTag:
      return;

    case Expr_.ArrayLiteral:
      for (const exprElement of expr.exprList) {
        scanGlobalVariableNameAndImportedPathInExpr(exprElement, scanData);
      }
      return;

    case Expr_.ObjectLiteral:
      for (const [, member] of expr.memberList) {
        scanGlobalVariableNameAndImportedPathInExpr(member, scanData);
      }
      return;

    case Expr_.LambdaWithReturn:
      for (const oneParameter of expr.parameterList) {
        typeExpr.scanGlobalVariableNameAndImportedPath(
          oneParameter.typeExpr,
          scanData
        );
      }
      typeExpr.scanGlobalVariableNameAndImportedPath(expr.returnType, scanData);
      scanGlobalVariableNameAndImportedPathInStatementList(
        expr.statementList,
        scanData
      );
      return;

    case Expr_.LambdaReturnVoid:
      for (const oneParameter of expr.parameterList) {
        typeExpr.scanGlobalVariableNameAndImportedPath(
          oneParameter.typeExpr,
          scanData
        );
      }
      scanGlobalVariableNameAndImportedPathInStatementList(
        expr.statementList,
        scanData
      );
      return;

    case Expr_.GlobalVariable:
      identifer.checkIdentiferThrow(
        "global variable name",
        "グローバル空間の変数名",
        expr.name
      );
      scanData.globalNameSet.add(expr.name);
      return;

    case Expr_.ImportedVariable:
      identifer.checkIdentiferThrow(
        "imported variable name",
        "インポートした変数名",
        expr.name
      );
      scanData.importedModulePath.add(expr.path);
      return;

    case Expr_.Get:
      scanGlobalVariableNameAndImportedPathInExpr(expr.expr, scanData);
      scanGlobalVariableNameAndImportedPathInExpr(expr.propertyName, scanData);
      return;

    case Expr_.Call:
      scanGlobalVariableNameAndImportedPathInExpr(expr.expr, scanData);
      for (const parameter of expr.parameterList) {
        scanGlobalVariableNameAndImportedPathInExpr(parameter, scanData);
      }
      return;

    case Expr_.New:
      scanGlobalVariableNameAndImportedPathInExpr(expr.expr, scanData);
      for (const parameter of expr.parameterList) {
        scanGlobalVariableNameAndImportedPathInExpr(parameter, scanData);
      }
      return;
  }
};

export const scanGlobalVariableNameAndImportedPathInStatementList = (
  statementList: ReadonlyArray<Statement>,
  scanData: type.ScanData
): void => {
  for (const statement of statementList) {
    scanGlobalVariableNameAndImportedPathInStatement(statement, scanData);
  }
};

export const scanGlobalVariableNameAndImportedPathInStatement = (
  statement: Statement,
  scanData: type.ScanData
): void => {
  switch (statement._) {
    case Statement_.EvaluateExpr:
      scanGlobalVariableNameAndImportedPathInExpr(statement.expr, scanData);
      return;

    case Statement_.Set:
      scanGlobalVariableNameAndImportedPathInExpr(
        statement.targetObject,
        scanData
      );
      scanGlobalVariableNameAndImportedPathInExpr(statement.expr, scanData);
      return;

    case Statement_.If:
      scanGlobalVariableNameAndImportedPathInExpr(
        statement.condition,
        scanData
      );
      scanGlobalVariableNameAndImportedPathInStatementList(
        statement.thenStatementList,
        scanData
      );
      return;

    case Statement_.ThrowError:
      return;

    case Statement_.Return:
      scanGlobalVariableNameAndImportedPathInExpr(statement.expr, scanData);
      return;

    case Statement_.ReturnVoid:
      return;

    case Statement_.Continue:
      return;

    case Statement_.VariableDefinition:
      scanGlobalVariableNameAndImportedPathInExpr(statement.expr, scanData);
      typeExpr.scanGlobalVariableNameAndImportedPath(
        statement.typeExpr,
        scanData
      );
      return;

    case Statement_.FunctionWithReturnValueVariableDefinition:
      for (const parameter of statement.parameterList) {
        typeExpr.scanGlobalVariableNameAndImportedPath(
          parameter.typeExpr,
          scanData
        );
      }
      typeExpr.scanGlobalVariableNameAndImportedPath(
        statement.returnType,
        scanData
      );
      scanGlobalVariableNameAndImportedPathInStatementList(
        statement.statementList,
        scanData
      );
      return;

    case Statement_.ReturnVoidFunctionVariableDefinition:
      for (const parameter of statement.parameterList) {
        typeExpr.scanGlobalVariableNameAndImportedPath(
          parameter.typeExpr,
          scanData
        );
      }
      scanGlobalVariableNameAndImportedPathInStatementList(
        statement.statementList,
        scanData
      );
      return;

    case Statement_.For:
      scanGlobalVariableNameAndImportedPathInExpr(
        statement.untilExpr,
        scanData
      );
      scanGlobalVariableNameAndImportedPathInStatementList(
        statement.statementList,
        scanData
      );
      return;

    case Statement_.ForOf:
      scanGlobalVariableNameAndImportedPathInExpr(
        statement.iterableExpr,
        scanData
      );
      scanGlobalVariableNameAndImportedPathInStatementList(
        statement.statementList,
        scanData
      );
      return;

    case Statement_.WhileTrue:
      scanGlobalVariableNameAndImportedPathInStatementList(
        statement.statementList,
        scanData
      );
  }
};

export const toNamedExpr = (
  expr: Expr,
  reservedWord: ReadonlySet<string>,
  importModuleMap: ReadonlyMap<string, string>,
  identiferIndex: identifer.IdentiferIndex,
  localVariableNameMapList: ReadonlyArray<ReadonlyMap<string, string>>,
  exposedConstEnumMap: type.ExportConstEnumMap
): namedExpr.Expr => {
  switch (expr._) {
    case Expr_.NumberLiteral:
      return {
        _: namedExpr.Expr_.NumberLiteral,
        value: expr.value
      };
    case Expr_.StringLiteral:
      return {
        _: namedExpr.Expr_.StringLiteral,
        value: expr.value
      };
    case Expr_.BooleanLiteral:
      return {
        _: namedExpr.Expr_.BooleanLiteral,
        value: expr.value
      };
    case Expr_.UndefinedLiteral:
      return {
        _: namedExpr.Expr_.UndefinedLiteral
      };
    case Expr_.NullLiteral:
      return {
        _: namedExpr.Expr_.NullLiteral
      };
    case Expr_.ArrayLiteral:
      return {
        _: namedExpr.Expr_.ArrayLiteral,
        exprList: expr.exprList.map(expr =>
          toNamedExpr(
            expr,
            reservedWord,
            importModuleMap,
            identiferIndex,
            localVariableNameMapList,
            exposedConstEnumMap
          )
        )
      };
    case Expr_.ObjectLiteral:
      return {
        _: namedExpr.Expr_.ObjectLiteral,
        memberList: new Map(
          [...expr.memberList].map(([name, expr]) => [
            name,
            toNamedExpr(
              expr,
              reservedWord,
              importModuleMap,
              identiferIndex,
              localVariableNameMapList,
              exposedConstEnumMap
            )
          ])
        )
      };
    case Expr_.UnaryOperator:
      return {
        _: namedExpr.Expr_.UnaryOperator,
        expr: toNamedExpr(
          expr.expr,
          reservedWord,
          importModuleMap,
          identiferIndex,
          localVariableNameMapList,
          exposedConstEnumMap
        ),
        operator: expr.operator
      };
    case Expr_.BinaryOperator:
      return {
        _: namedExpr.Expr_.BinaryOperator,
        left: toNamedExpr(
          expr.left,
          reservedWord,
          importModuleMap,
          identiferIndex,
          localVariableNameMapList,
          exposedConstEnumMap
        ),
        right: toNamedExpr(
          expr.right,
          reservedWord,
          importModuleMap,
          identiferIndex,
          localVariableNameMapList,
          exposedConstEnumMap
        ),
        operator: expr.operator
      };
    case Expr_.ConditionalOperator:
      return {
        _: namedExpr.Expr_.ConditionalOperator,
        condition: toNamedExpr(
          expr,
          reservedWord,
          importModuleMap,
          identiferIndex,
          localVariableNameMapList,
          exposedConstEnumMap
        ),
        elseExpr: toNamedExpr(
          expr,
          reservedWord,
          importModuleMap,
          identiferIndex,
          localVariableNameMapList,
          exposedConstEnumMap
        ),
        thenExpr: toNamedExpr(
          expr,
          reservedWord,
          importModuleMap,
          identiferIndex,
          localVariableNameMapList,
          exposedConstEnumMap
        )
      };
    case Expr_.LambdaWithReturn: {
      const parameterNameMap: Array<{
        oldName: string;
        name: string;
        typeExpr: namedTypeExpr.TypeExpr;
      }> = [];
      let identiferIndex = identifer.initialIdentiferIndex;
      for (const parameter of expr.parameterList) {
        const identiferAndNextIndex = identifer.createIdentifer(
          identiferIndex,
          reservedWord
        );
        identiferIndex = identiferAndNextIndex.nextIdentiferIndex;
        parameterNameMap.push({
          oldName: variableNameListToMapKey(parameter.name),
          name: identiferAndNextIndex.identifer,
          typeExpr: typeExpr.toNamed(
            parameter.typeExpr,
            reservedWord,
            importModuleMap
          )
        });
      }
      return {
        _: namedExpr.Expr_.LambdaWithReturn,
        parameterList: parameterNameMap,
        returnType: typeExpr.toNamed(
          expr.returnType,
          reservedWord,
          importModuleMap
        ),
        statementList: toNamedStatementList(
          expr.statementList,
          reservedWord,
          importModuleMap,
          identiferIndex,
          localVariableNameMapList,
          new Map(
            parameterNameMap.map(parameter => [
              parameter.oldName,
              parameter.name
            ])
          ),
          exposedConstEnumMap
        )
      };
    }
    case Expr_.LambdaReturnVoid: {
      const parameterList: Array<{
        oldName: string;
        name: string;
        typeExpr: namedTypeExpr.TypeExpr;
      }> = [];
      let identiferIndex = identifer.initialIdentiferIndex;
      for (const parameter of expr.parameterList) {
        const identiferAndNextIndex = identifer.createIdentifer(
          identiferIndex,
          reservedWord
        );
        identiferIndex = identiferAndNextIndex.nextIdentiferIndex;
        parameterList.push({
          oldName: variableNameListToMapKey(parameter.name),
          name: identiferAndNextIndex.identifer,
          typeExpr: typeExpr.toNamed(
            parameter.typeExpr,
            reservedWord,
            importModuleMap
          )
        });
      }
      return {
        _: namedExpr.Expr_.LambdaReturnVoid,
        parameterList,
        statementList: toNamedStatementList(
          expr.statementList,
          reservedWord,
          importModuleMap,
          identiferIndex,
          localVariableNameMapList,
          new Map(
            parameterList.map(parameter => [parameter.oldName, parameter.name])
          ),
          exposedConstEnumMap
        )
      };
    }

    case Expr_.GlobalVariable:
      return {
        _: namedExpr.Expr_.GlobalVariable,
        name: expr.name
      };

    case Expr_.ImportedVariable: {
      const nameSpaceIdentifer: string | undefined = importModuleMap.get(
        expr.path
      );
      if (nameSpaceIdentifer === undefined) {
        throw new Error(
          `認識されていない外部モジュールの名前空間識別子を発見した in expr (${expr.path})`
        );
      }
      return {
        _: namedExpr.Expr_.ImportedVariable,
        nameSpaceIdentifer: nameSpaceIdentifer,
        name: expr.name
      };
    }

    case Expr_.Get:
      return {
        _: namedExpr.Expr_.Get,
        expr: toNamedExpr(
          expr.expr,
          reservedWord,
          importModuleMap,
          identiferIndex,
          localVariableNameMapList,
          exposedConstEnumMap
        ),
        propertyName: toNamedExpr(
          expr.propertyName,
          reservedWord,
          importModuleMap,
          identiferIndex,
          localVariableNameMapList,
          exposedConstEnumMap
        )
      };

    case Expr_.Call:
      return {
        _: namedExpr.Expr_.Call,
        expr: toNamedExpr(
          expr.expr,
          reservedWord,
          importModuleMap,
          identiferIndex,
          localVariableNameMapList,
          exposedConstEnumMap
        ),
        parameterList: expr.parameterList.map(parameter =>
          toNamedExpr(
            parameter,
            reservedWord,
            importModuleMap,
            identiferIndex,
            localVariableNameMapList,
            exposedConstEnumMap
          )
        )
      };
    case Expr_.New:
      return {
        _: namedExpr.Expr_.New,
        expr: toNamedExpr(
          expr.expr,
          reservedWord,
          importModuleMap,
          identiferIndex,
          localVariableNameMapList,
          exposedConstEnumMap
        ),
        parameterList: expr.parameterList.map(parameter =>
          toNamedExpr(
            parameter,
            reservedWord,
            importModuleMap,
            identiferIndex,
            localVariableNameMapList,
            exposedConstEnumMap
          )
        )
      };
    case Expr_.LocalVariable: {
      return {
        _: namedExpr.Expr_.LocalVariable,
        name: searchName(localVariableNameMapList, expr.name)
      };
    }

    case Expr_.EnumTag: {
      const tagNameAndValueList = exposedConstEnumMap.get(expr.typeName);

      if (tagNameAndValueList === undefined) {
        throw new Error(
          "外部に公開していない列挙型のパターンを使おうとしている typeName=" +
            expr.typeName
        );
      }
      const value = tagNameAndValueList.get(expr.tagName);
      if (value === undefined) {
        throw new Error(
          "存在しないパターンを指定した typeName=" +
            expr.typeName +
            " allPattern=[" +
            [...tagNameAndValueList.keys()].join(",") +
            "] patternName=" +
            expr.tagName
        );
      }

      return {
        _: namedExpr.Expr_.ConstEnumPattern,
        tagName: expr.tagName,
        typeName: expr.typeName,
        value: value
      };
    }
  }
};

const searchName = (
  localVariableNameMapList: ReadonlyArray<ReadonlyMap<string, string>>,
  oldName: ReadonlyArray<string>
): string => {
  for (let i = 0; i < localVariableNameMapList.length; i++) {
    const variable = localVariableNameMapList[
      localVariableNameMapList.length - 1 - i
    ].get(variableNameListToMapKey(oldName));
    if (variable !== undefined) {
      return variable;
    }
  }
  throw new Error(
    "存在しない変数を指定されました name=" + variableNameListToMapKey(oldName)
  );
};

export const toNamedStatementList = (
  statementList: ReadonlyArray<Statement>,
  reservedWord: ReadonlySet<string>,
  importedModuleNameMap: ReadonlyMap<string, string>,
  identiferIndex: identifer.IdentiferIndex,
  localVariableNameMapList: ReadonlyArray<ReadonlyMap<string, string>>,
  argumentNameMap: ReadonlyMap<string, string>,
  exposedConstEnumMap: type.ExportConstEnumMap
): ReadonlyArray<namedExpr.Statement> => {
  const variableNameInScopeList: Map<string, string> = new Map();

  // スコープ内にある変数定義を見て、変数名を決める
  for (const statement of statementList) {
    switch (statement._) {
      case Statement_.VariableDefinition:
      case Statement_.ReturnVoidFunctionVariableDefinition:
      case Statement_.FunctionWithReturnValueVariableDefinition: {
        const identiferAndIndex = identifer.createIdentifer(
          identiferIndex,
          reservedWord
        );
        variableNameInScopeList.set(
          variableNameListToMapKey(statement.name),
          identiferAndIndex.identifer
        );
        identiferIndex = identiferAndIndex.nextIdentiferIndex;
      }
    }
  }
  const newArgumentVariableNameMapList: ReadonlyArray<ReadonlyMap<
    string,
    string
  >> = [
    ...localVariableNameMapList,
    new Map([...argumentNameMap, ...variableNameInScopeList])
  ];
  const namedStatementList: Array<namedExpr.Statement> = [];
  let variableDefinitionIndex = 0;
  for (const statement of statementList) {
    const statementAndIndex = toNamedStatement(
      statement,
      reservedWord,
      importedModuleNameMap,
      identiferIndex,
      newArgumentVariableNameMapList,
      variableDefinitionIndex,
      exposedConstEnumMap
    );
    namedStatementList.push(statementAndIndex.statement);
    variableDefinitionIndex = statementAndIndex.index;
  }
  return namedStatementList;
};

export const toNamedStatement = (
  statement: Statement,
  reservedWord: ReadonlySet<string>,
  importedModuleNameMap: ReadonlyMap<string, string>,
  identiferIndex: identifer.IdentiferIndex,
  variableNameMapList: ReadonlyArray<ReadonlyMap<string, string>>,
  variableDefinitionIndex: number,
  exposedConstEnumMap: type.ExportConstEnumMap
): { statement: namedExpr.Statement; index: number } => {
  switch (statement._) {
    case Statement_.EvaluateExpr:
      return {
        statement: {
          _: namedExpr.Statement_.EvaluateExpr,
          expr: toNamedExpr(
            statement.expr,
            reservedWord,
            importedModuleNameMap,
            identiferIndex,
            variableNameMapList,
            exposedConstEnumMap
          )
        },
        index: variableDefinitionIndex
      };
    case Statement_.Set:
      return {
        statement: {
          _: namedExpr.Statement_.Set,
          targetObject: toNamedExpr(
            statement.targetObject,
            reservedWord,
            importedModuleNameMap,
            identiferIndex,
            variableNameMapList,
            exposedConstEnumMap
          ),
          operator: statement.operator,
          expr: toNamedExpr(
            statement.expr,
            reservedWord,
            importedModuleNameMap,
            identiferIndex,
            variableNameMapList,
            exposedConstEnumMap
          )
        },
        index: variableDefinitionIndex
      };

    case Statement_.If:
      return {
        statement: {
          _: namedExpr.Statement_.If,
          condition: toNamedExpr(
            statement.condition,
            reservedWord,
            importedModuleNameMap,
            identiferIndex,
            variableNameMapList,
            exposedConstEnumMap
          ),
          thenStatementList: toNamedStatementList(
            statement.thenStatementList,
            reservedWord,
            importedModuleNameMap,
            identiferIndex,
            variableNameMapList,
            new Map(),
            exposedConstEnumMap
          )
        },
        index: variableDefinitionIndex
      };
    case Statement_.ThrowError:
      return {
        statement: {
          _: namedExpr.Statement_.ThrowError,
          errorMessage: statement.errorMessage
        },
        index: variableDefinitionIndex
      };

    case Statement_.Return:
      return {
        statement: {
          _: namedExpr.Statement_.Return,
          expr: toNamedExpr(
            statement.expr,
            reservedWord,
            importedModuleNameMap,
            identiferIndex,
            variableNameMapList,
            exposedConstEnumMap
          )
        },
        index: variableDefinitionIndex
      };
    case Statement_.ReturnVoid:
      return {
        statement: {
          _: namedExpr.Statement_.ReturnVoid
        },
        index: variableDefinitionIndex
      };

    case Statement_.Continue:
      return {
        statement: {
          _: namedExpr.Statement_.Continue
        },
        index: variableDefinitionIndex
      };

    case Statement_.VariableDefinition:
      return {
        statement: {
          _: namedExpr.Statement_.VariableDefinition,
          expr: toNamedExpr(
            statement.expr,
            reservedWord,
            importedModuleNameMap,
            identiferIndex,
            variableNameMapList,
            exposedConstEnumMap
          ),
          name: searchName(variableNameMapList, statement.name),
          typeExpr: typeExpr.toNamed(
            statement.typeExpr,
            reservedWord,
            importedModuleNameMap
          ),
          isConst: statement.isConst
        },
        index: variableDefinitionIndex + 1
      };
    case Statement_.FunctionWithReturnValueVariableDefinition: {
      const namedParameterList: Array<{
        oldName: string;
        name: string;
        typeExpr: namedTypeExpr.TypeExpr;
      }> = [];
      for (const parameter of statement.parameterList) {
        const identiferAndIndex = identifer.createIdentifer(
          identiferIndex,
          reservedWord
        );
        namedParameterList.push({
          oldName: variableNameListToMapKey(parameter.name),
          name: identiferAndIndex.identifer,
          typeExpr: typeExpr.toNamed(
            parameter.typeExpr,
            reservedWord,
            importedModuleNameMap
          )
        });
        identiferIndex = identiferAndIndex.nextIdentiferIndex;
      }
      return {
        statement: {
          _: namedExpr.Statement_.FunctionWithReturnValueVariableDefinition,
          name: searchName(variableNameMapList, statement.name),
          parameterList: namedParameterList,
          returnType: typeExpr.toNamed(
            statement.returnType,
            reservedWord,
            importedModuleNameMap
          ),
          statementList: toNamedStatementList(
            statement.statementList,
            reservedWord,
            importedModuleNameMap,
            identiferIndex,
            variableNameMapList,
            new Map(
              namedParameterList.map(parameter => [
                parameter.oldName,
                parameter.name
              ])
            ),
            exposedConstEnumMap
          )
        },
        index: variableDefinitionIndex + 1
      };
    }
    case Statement_.ReturnVoidFunctionVariableDefinition: {
      const namedParameterList: Array<{
        oldName: string;
        name: string;
        typeExpr: namedTypeExpr.TypeExpr;
      }> = [];
      for (const parameter of statement.parameterList) {
        const identiferAndIndex = identifer.createIdentifer(
          identiferIndex,
          reservedWord
        );
        namedParameterList.push({
          oldName: variableNameListToMapKey(parameter.name),
          name: identiferAndIndex.identifer,
          typeExpr: typeExpr.toNamed(
            parameter.typeExpr,
            reservedWord,
            importedModuleNameMap
          )
        });
        identiferIndex = identiferAndIndex.nextIdentiferIndex;
      }
      return {
        statement: {
          _: namedExpr.Statement_.ReturnVoidFunctionVariableDefinition,
          name: searchName(variableNameMapList, statement.name),
          parameterList: namedParameterList,
          statementList: toNamedStatementList(
            statement.statementList,
            reservedWord,
            importedModuleNameMap,
            identiferIndex,
            variableNameMapList,
            new Map(
              namedParameterList.map(parameter => [
                parameter.oldName,
                parameter.name
              ])
            ),
            exposedConstEnumMap
          )
        },
        index: variableDefinitionIndex + 1
      };
    }
    case Statement_.For: {
      const counterVariableNameAndIndex = identifer.createIdentifer(
        identiferIndex,
        reservedWord
      );
      return {
        statement: {
          _: namedExpr.Statement_.For,
          counterVariableName: counterVariableNameAndIndex.identifer,
          statementList: toNamedStatementList(
            statement.statementList,
            reservedWord,
            importedModuleNameMap,
            counterVariableNameAndIndex.nextIdentiferIndex,
            variableNameMapList,
            new Map([
              [
                variableNameListToMapKey(statement.counterVariableName),
                counterVariableNameAndIndex.identifer
              ]
            ]),
            exposedConstEnumMap
          ),
          untilExpr: toNamedExpr(
            statement.untilExpr,
            reservedWord,
            importedModuleNameMap,
            identiferIndex,
            variableNameMapList,
            exposedConstEnumMap
          )
        },
        index: variableDefinitionIndex
      };
    }
    case Statement_.ForOf: {
      const elementVariableNameAndIndex = identifer.createIdentifer(
        identiferIndex,
        reservedWord
      );
      return {
        statement: {
          _: namedExpr.Statement_.ForOf,
          elementVariableName: elementVariableNameAndIndex.identifer,
          statementList: toNamedStatementList(
            statement.statementList,
            reservedWord,
            importedModuleNameMap,
            elementVariableNameAndIndex.nextIdentiferIndex,
            variableNameMapList,
            new Map([
              [
                variableNameListToMapKey(statement.elementVariableName),
                elementVariableNameAndIndex.identifer
              ]
            ]),
            exposedConstEnumMap
          ),
          iterableExpr: toNamedExpr(
            statement.iterableExpr,
            reservedWord,
            importedModuleNameMap,
            identiferIndex,
            variableNameMapList,
            exposedConstEnumMap
          )
        },
        index: variableDefinitionIndex
      };
    }
    case Statement_.WhileTrue:
      return {
        statement: {
          _: namedExpr.Statement_.WhileTrue,
          statementList: toNamedStatementList(
            statement.statementList,
            reservedWord,
            importedModuleNameMap,
            identiferIndex,
            variableNameMapList,
            new Map(),
            exposedConstEnumMap
          )
        },
        index: variableDefinitionIndex
      };
    case Statement_.Break:
      return {
        statement: {
          _: namedExpr.Statement_.Break
        },
        index: variableDefinitionIndex
      };
  }
};

/**
 * JSのMapのキーに配列を使った場合、参照でしか等しいか計算しないため、文字列に変換している
 */
const variableNameListToMapKey = (nameList: ReadonlyArray<string>): string =>
  nameList.join("!");
