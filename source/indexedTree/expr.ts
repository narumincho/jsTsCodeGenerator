import * as identifer from "../identifer";
import * as scanType from "../scanType";
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
      _: Expr_.ObjectLiteral;
      memberList: Map<string, Expr>;
    }
  | {
      _: Expr_.LambdaWithReturn;
      parameterList: ReadonlyArray<typeExpr.TypeExpr>;
      returnType: typeExpr.TypeExpr;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: Expr_.LambdaReturnVoid;
      parameterList: ReadonlyArray<typeExpr.TypeExpr>;
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
      _: Expr_.Argument;
      index: number;
      depth: number;
    }
  | {
      _: Expr_.GetProperty;
      expr: Expr;
      propertyName: string;
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
      index: number;
      depth: number;
    };

const enum Expr_ {
  NumberLiteral,
  StringLiteral,
  BooleanLiteral,
  UndefinedLiteral,
  NullLiteral,
  ObjectLiteral,
  UnaryOperator,
  BinaryOperator,
  ConditionalOperator,
  LambdaWithReturn,
  LambdaReturnVoid,
  GlobalVariable,
  ImportedVariable,
  Argument,
  GetProperty,
  Call,
  New,
  LocalVariable
}

type UnaryOperator = "-" | "~" | "!";

type BinaryOperator =
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
 * オブジェクトリテラル
 * 順番は保証されないので、副作用の含んだ式を入れないこと
 */
export const createObjectLiteral = (memberList: Map<string, Expr>): Expr => {
  return {
    _: Expr_.ObjectLiteral,
    memberList: memberList
  };
};

/**
 * 戻り値のあるラムダ式
 * @param parameter パラメーター
 * @param returnType 戻り値
 * @param statementList 本体
 */
export const createLambdaWithReturn = (
  parameterList: ReadonlyArray<typeExpr.TypeExpr>,
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
export const createLambdaReturnVoid = (
  parameterList: ReadonlyArray<typeExpr.TypeExpr>,
  statementList: ReadonlyArray<Statement>
): Expr => ({
  _: Expr_.LambdaReturnVoid,
  parameterList,
  statementList
});

/**
 * プロパティの値を取得する
 * @param expr 式
 * @param propertyName プロパティ
 */
export const getProperty = (expr: Expr, propertyName: string): Expr => ({
  _: Expr_.GetProperty,
  expr,
  propertyName
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
 * @param depth 何個スコープの外側のものか
 * @param index 何個目変数か
 */
export const localVariable = (depth: number, index: number): Expr => {
  if (depth < 0) {
    throw new Error("localVariable depth < 0");
  }
  if (index < 0) {
    throw new Error("localVariable index < 0");
  }
  return {
    _: Expr_.LocalVariable,
    depth,
    index
  };
};

/**
 * ラムダ式などの引数
 * @param depth 何個スコープの外側のものか
 * @param index 何個目の引数か
 */
export const argument = (depth: number, index: number): Expr => {
  if (depth < 0) {
    throw new Error("argument depth < 0");
  }
  if (index < 0) {
    throw new Error("argument index < 0");
  }
  return {
    _: Expr_.Argument,
    depth,
    index
  };
};

/**
 * 文
 */
export type Statement =
  | {
      _: Statement_.EvaluateExpr;
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
      expr: Expr;
      typeExpr: typeExpr.TypeExpr;
    }
  | {
      _: Statement_.FunctionWithReturnValueVariableDefinition;
      parameterList: ReadonlyArray<typeExpr.TypeExpr>;
      returnType: typeExpr.TypeExpr;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: Statement_.ReturnVoidFunctionVariableDefinition;
      parameterList: ReadonlyArray<typeExpr.TypeExpr>;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: Statement_.For;
      untilExpr: Expr;
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
  If,
  ThrowError,
  Return,
  ReturnVoid,
  Continue,
  VariableDefinition,
  FunctionWithReturnValueVariableDefinition,
  ReturnVoidFunctionVariableDefinition,
  For,
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
 * const a: typeExpr = expr
 * ローカル変数の定義。変数名は自動で決まる
 * @param typeExpr 型
 * @param expr 式
 */
export const variableDefinition = (
  typeExpr: typeExpr.TypeExpr,
  expr: Expr
): Statement => ({
  _: Statement_.VariableDefinition,
  expr,
  typeExpr
});

/**
 * const a = (parameterList): returnType => { statementList }
 * ローカル関数の定義。変数名は自動で決まる
 * @param parameterList パラメータ
 * @param returnType 戻り値の型
 * @param statementList 関数本体
 */
export const functionWithReturnValueVariableDefinition = (
  parameterList: ReadonlyArray<typeExpr.TypeExpr>,
  returnType: typeExpr.TypeExpr,
  statementList: ReadonlyArray<Statement>
): Statement => ({
  _: Statement_.FunctionWithReturnValueVariableDefinition,
  parameterList,
  returnType,
  statementList
});

/**
 * const a = (parameterList): void => { statementList }
 * 戻り値がないローカル関数の定義。変数名は自動で決まる
 * @param parameterList パラメータ
 * @param statementList 関数本体
 */
export const returnVoidFunctionVariableDefinition = (
  parameterList: ReadonlyArray<typeExpr.TypeExpr>,
  statementList: ReadonlyArray<Statement>
): Statement => ({
  _: Statement_.ReturnVoidFunctionVariableDefinition,
  parameterList,
  statementList
});

/**
 * for (let a = 0; a < untilExpr; a+=1) { statementList }
 * for文。繰り返し。カウンタ変数へのアクセスは `argument` で行う
 * @param untilExpr 繰り返す数 + 1
 * @param statementList 繰り返す内容
 */
export const forStatement = (
  untilExpr: Expr,
  statementList: ReadonlyArray<Statement>
): Statement => ({
  _: Statement_.For,
  statementList,
  untilExpr
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
  scanData: scanType.NodeJsCodeScanData
): void => {
  switch (expr._) {
    case Expr_.NumberLiteral:
    case Expr_.UnaryOperator:
    case Expr_.StringLiteral:
    case Expr_.BooleanLiteral:
    case Expr_.UndefinedLiteral:
    case Expr_.NullLiteral:
      return;

    case Expr_.ObjectLiteral:
      for (const [propertyName, member] of expr.memberList) {
        identifer.checkUsingReservedWord(
          "object literal property name",
          "オブジェクトリテラルのプロパティ名",
          propertyName
        );
        scanGlobalVariableNameAndImportedPathInExpr(member, scanData);
      }
      return;

    case Expr_.LambdaWithReturn:
      for (const oneParameter of expr.parameterList) {
        typeExpr.scanGlobalVariableNameAndImportedPath(oneParameter, scanData);
      }
      typeExpr.scanGlobalVariableNameAndImportedPath(expr.returnType, scanData);
      scanGlobalVariableNameAndImportedPathInStatementList(
        expr.statementList,
        scanData
      );
      return;

    case Expr_.LambdaReturnVoid:
      for (const oneParameter of expr.parameterList) {
        typeExpr.scanGlobalVariableNameAndImportedPath(oneParameter, scanData);
      }
      scanGlobalVariableNameAndImportedPathInStatementList(
        expr.statementList,
        scanData
      );
      return;

    case Expr_.GlobalVariable:
      identifer.checkUsingReservedWord(
        "global variable name",
        "グローバル空間の変数名",
        expr.name
      );
      scanData.globalNameSet.add(expr.name);
      return;

    case Expr_.ImportedVariable:
      identifer.checkUsingReservedWord(
        "imported variable name",
        "インポートした変数名",
        expr.name
      );
      scanData.importedModulePath.add(expr.path);
      return;

    case Expr_.Argument:
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
  scanData: scanType.NodeJsCodeScanData
): void => {
  for (const statement of statementList) {
    scanGlobalVariableNameAndImportedPathInStatement(statement, scanData);
  }
};

export const scanGlobalVariableNameAndImportedPathInStatement = (
  statement: Statement,
  scanData: scanType.NodeJsCodeScanData
): void => {
  switch (statement._) {
    case Statement_.EvaluateExpr:
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
        typeExpr.scanGlobalVariableNameAndImportedPath(parameter, scanData);
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
        typeExpr.scanGlobalVariableNameAndImportedPath(parameter, scanData);
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
  argumentAndLocalVariableNameList: ReadonlyArray<{
    argument: ReadonlyArray<string>;
    variable: ReadonlyArray<string>;
  }>
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
              argumentAndLocalVariableNameList
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
          argumentAndLocalVariableNameList
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
          argumentAndLocalVariableNameList
        ),
        right: toNamedExpr(
          expr.right,
          reservedWord,
          importModuleMap,
          identiferIndex,
          argumentAndLocalVariableNameList
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
          argumentAndLocalVariableNameList
        ),
        elseExpr: toNamedExpr(
          expr,
          reservedWord,
          importModuleMap,
          identiferIndex,
          argumentAndLocalVariableNameList
        ),
        thenExpr: toNamedExpr(
          expr,
          reservedWord,
          importModuleMap,
          identiferIndex,
          argumentAndLocalVariableNameList
        )
      };
    case Expr_.LambdaWithReturn: {
      const parameterList: Array<{
        name: string;
        typeExpr: namedTypeExpr.TypeExpr;
      }> = [];
      let identiferIndex = identifer.initialIdentiferIndex;
      for (const parameterType of expr.parameterList) {
        const identiferAndNextIndex = identifer.createIdentifer(
          identiferIndex,
          reservedWord
        );
        identiferIndex = identiferAndNextIndex.nextIdentiferIndex;
        parameterList.push({
          name: identiferAndNextIndex.identifer,
          typeExpr: typeExpr.toNamed(
            parameterType,
            reservedWord,
            importModuleMap
          )
        });
      }
      return {
        _: namedExpr.Expr_.LambdaWithReturn,
        parameterList,
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
          argumentAndLocalVariableNameList,
          parameterList.map(parameter => parameter.name)
        )
      };
    }
    case Expr_.LambdaReturnVoid: {
      const parameterList: Array<{
        name: string;
        typeExpr: namedTypeExpr.TypeExpr;
      }> = [];
      let identiferIndex = identifer.initialIdentiferIndex;
      for (const parameterType of expr.parameterList) {
        const identiferAndNextIndex = identifer.createIdentifer(
          identiferIndex,
          reservedWord
        );
        identiferIndex = identiferAndNextIndex.nextIdentiferIndex;
        parameterList.push({
          name: identiferAndNextIndex.identifer,
          typeExpr: typeExpr.toNamed(
            parameterType,
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
          argumentAndLocalVariableNameList,
          parameterList.map(parameter => parameter.name)
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

    case Expr_.Argument: {
      const name = getElementByLastIndex(
        argumentAndLocalVariableNameList,
        expr.depth
      ).argument[expr.index];
      if (name === undefined) {
        throw Error(
          "範囲外の引数を指定されました index=" + expr.index.toString()
        );
      }
      return {
        _: namedExpr.Expr_.Argument,
        name
      };
    }
    case Expr_.GetProperty:
      return {
        _: namedExpr.Expr_.GetProperty,
        expr: toNamedExpr(
          expr.expr,
          reservedWord,
          importModuleMap,
          identiferIndex,
          argumentAndLocalVariableNameList
        ),
        propertyName: expr.propertyName
      };
    case Expr_.Call:
      return {
        _: namedExpr.Expr_.Call,
        expr: toNamedExpr(
          expr.expr,
          reservedWord,
          importModuleMap,
          identiferIndex,
          argumentAndLocalVariableNameList
        ),
        parameterList: expr.parameterList.map(parameter =>
          toNamedExpr(
            parameter,
            reservedWord,
            importModuleMap,
            identiferIndex,
            argumentAndLocalVariableNameList
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
          argumentAndLocalVariableNameList
        ),
        parameterList: expr.parameterList.map(parameter =>
          toNamedExpr(
            parameter,
            reservedWord,
            importModuleMap,
            identiferIndex,
            argumentAndLocalVariableNameList
          )
        )
      };
    case Expr_.LocalVariable: {
      const name = getElementByLastIndex(
        argumentAndLocalVariableNameList,
        expr.depth
      ).variable[expr.index];
      if (name === undefined) {
        throw new Error(
          "範囲外のローカル変数を指定されました index=" + expr.index.toString()
        );
      }
      return {
        _: namedExpr.Expr_.LocalVariable,
        name
      };
    }
  }
};

export const toNamedStatementList = (
  statementList: ReadonlyArray<Statement>,
  reservedWord: ReadonlySet<string>,
  importedModuleNameMap: ReadonlyMap<string, string>,
  identiferIndex: identifer.IdentiferIndex,
  argumentAndLocalVariableNameList: ReadonlyArray<{
    argument: ReadonlyArray<string>;
    variable: ReadonlyArray<string>;
  }>,
  argumentNameList: ReadonlyArray<string>
): ReadonlyArray<namedExpr.Statement> => {
  const variableNameInScopeList: Array<string> = [];

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
        variableNameInScopeList.push(identiferAndIndex.identifer);
        identiferIndex = identiferAndIndex.nextIdentiferIndex;
      }
    }
  }
  const newArgumentAndLocalVariableNameList: ReadonlyArray<{
    argument: ReadonlyArray<string>;
    variable: ReadonlyArray<string>;
  }> = [
    ...argumentAndLocalVariableNameList,
    { argument: argumentNameList, variable: variableNameInScopeList }
  ];
  const namedStatementList: Array<namedExpr.Statement> = [];
  let variableDefinitionIndex = 0;
  for (const statement of statementList) {
    const statementAndIndex = toNamedStatement(
      statement,
      reservedWord,
      importedModuleNameMap,
      identiferIndex,
      newArgumentAndLocalVariableNameList,
      variableDefinitionIndex
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
  argumentAndLocalVariableNameList: ReadonlyArray<{
    argument: ReadonlyArray<string>;
    variable: ReadonlyArray<string>;
  }>,
  variableDefinitionIndex: number
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
            argumentAndLocalVariableNameList
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
            argumentAndLocalVariableNameList
          ),
          thenStatementList: toNamedStatementList(
            statement.thenStatementList,
            reservedWord,
            importedModuleNameMap,
            identiferIndex,
            argumentAndLocalVariableNameList,
            []
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
            argumentAndLocalVariableNameList
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
            argumentAndLocalVariableNameList
          ),
          name: getElementByLastIndex(argumentAndLocalVariableNameList, 0)
            .variable[variableDefinitionIndex],
          typeExpr: typeExpr.toNamed(
            statement.typeExpr,
            reservedWord,
            importedModuleNameMap
          )
        },
        index: variableDefinitionIndex + 1
      };
    case Statement_.FunctionWithReturnValueVariableDefinition: {
      const namedParameterList: Array<{
        name: string;
        typeExpr: namedTypeExpr.TypeExpr;
      }> = [];
      for (const parameter of statement.parameterList) {
        const identiferAndIndex = identifer.createIdentifer(
          identiferIndex,
          reservedWord
        );
        namedParameterList.push({
          name: identiferAndIndex.identifer,
          typeExpr: typeExpr.toNamed(
            parameter,
            reservedWord,
            importedModuleNameMap
          )
        });
        identiferIndex = identiferAndIndex.nextIdentiferIndex;
      }
      return {
        statement: {
          _: namedExpr.Statement_.FunctionWithReturnValueVariableDefinition,
          name: getElementByLastIndex(argumentAndLocalVariableNameList, 0)
            .variable[variableDefinitionIndex],
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
            argumentAndLocalVariableNameList,
            namedParameterList.map(parameter => parameter.name)
          )
        },
        index: variableDefinitionIndex + 1
      };
    }
    case Statement_.ReturnVoidFunctionVariableDefinition: {
      const namedParameterList: Array<{
        name: string;
        typeExpr: namedTypeExpr.TypeExpr;
      }> = [];
      for (const parameter of statement.parameterList) {
        const identiferAndIndex = identifer.createIdentifer(
          identiferIndex,
          reservedWord
        );
        namedParameterList.push({
          name: identiferAndIndex.identifer,
          typeExpr: typeExpr.toNamed(
            parameter,
            reservedWord,
            importedModuleNameMap
          )
        });
        identiferIndex = identiferAndIndex.nextIdentiferIndex;
      }
      return {
        statement: {
          _: namedExpr.Statement_.ReturnVoidFunctionVariableDefinition,
          name: getElementByLastIndex(argumentAndLocalVariableNameList, 0)
            .variable[variableDefinitionIndex],
          parameterList: namedParameterList,
          statementList: toNamedStatementList(
            statement.statementList,
            reservedWord,
            importedModuleNameMap,
            identiferIndex,
            argumentAndLocalVariableNameList,
            namedParameterList.map(parameter => parameter.name)
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
            argumentAndLocalVariableNameList,
            [counterVariableNameAndIndex.identifer]
          ),
          untilExpr: toNamedExpr(
            statement.untilExpr,
            reservedWord,
            importedModuleNameMap,
            identiferIndex,
            argumentAndLocalVariableNameList
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
            argumentAndLocalVariableNameList,
            []
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
 * 配列の要素を最後のインデックスから取得する
 * @param array 配列
 * @param index 0から始まるindex
 */
const getElementByLastIndex = <T>(
  array: ReadonlyArray<T>,
  index: number
): T => {
  const element = array[array.length - 1 - index];
  if (element === undefined) {
    throw new Error("index error");
  }
  return element;
};
