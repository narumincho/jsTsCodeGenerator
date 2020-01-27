import * as identifer from "../identifer";
import * as scanType from "../scanType";
import * as typeExpr from "./typeExpr";
import * as namedExpr from "../namedTree/expr";
import * as namedTypeExpr from "../namedTree/typeExpr";
import { type } from "os";

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

type ValueOf<T> = T[keyof T];

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
 * @param expr 式
 * @param id 識別するためのID  (同じものがあった場合スコープの内側を優先)
 */
export const localVariable = (depth: number, index: number): Expr => ({
  _: Expr_.LocalVariable,
  depth,
  index
});

/**
 * 文
 */
export type Statement =
  | {
      _: Statement_.If;
      condition: Expr;
      thenStatementList: ReadonlyArray<Statement>;
    }
  | {
      _: Statement_.Throw;
      errorMessage: string;
    }
  | {
      _: Statement_.Return;
      expr: Expr;
    }
  | {
      _: Statement_.Continue;
    }
  | {
      _: Statement_.VariableDefinition;
      expr: Expr;
      typeExpr: Expr;
    }
  | {
      _: Statement_.FunctionWithReturnValueVariableDefinition;
      parameterList: ReadonlyArray<typeExpr.TypeExpr>;
      returnType: typeExpr.TypeExpr;
      statement: ReadonlyArray<Statement>;
      returnExpr: Expr;
    }
  | {
      _: Statement_.ReturnVoidFunctionVariableDefinition;
      parameterList: ReadonlyArray<typeExpr.TypeExpr>;
      statement: ReadonlyArray<Statement>;
    }
  | {
      _: Statement_.For;
      untilExpr: Expr;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: Statement_.While;
      statementList: ReadonlyArray<Statement>;
    };

const enum Statement_ {
  If,
  Throw,
  Return,
  Continue,
  VariableDefinition,
  FunctionWithReturnValueVariableDefinition,
  ReturnVoidFunctionVariableDefinition,
  For,
  While
}

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
      scanGlobalVariableNameAndImportedPathInExpr(expr.body, scanData);
      return;

    case Expr_.LambdaReturnVoid:
      for (const oneParameter of expr.parameterList) {
        typeExpr.scanGlobalVariableNameAndImportedPath(oneParameter, scanData);
      }
      scanGlobalVariableNameAndImportedPathInExpr(expr.body, scanData);
      return;

    case Expr_.GlobalVariable:
      identifer.checkUsingReservedWord(
        "global variable name",
        "グローバル空間の変数名",
        expr.name
      );
      scanData.globalName.add(expr.name);
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
      identifer.checkUsingReservedWord(
        "argument name",
        "ラムダ式の引数の変数名",
        expr.name
      );
      scanData.globalName.add(expr.name);
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
    case Statement_.If:
    case Statement_.Throw:
    case Statement_.Return:
    case Statement_.Continue:
    case Statement_.VariableDefinition:
    case Statement_.FunctionWithReturnValueVariableDefinition:
    case Statement_.ReturnVoidFunctionVariableDefinition:
    case Statement_.For:
    case Statement_.While:
  }
};

export const toNamedExpr = (
  expr: Expr,
  reservedWord: Set<string>,
  identiferIndex: identifer.IdentiferIndex
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
            toNamedExpr(expr, reservedWord, identiferIndex)
          ])
        )
      };
    case Expr_.UnaryOperator:
      return {
        _: namedExpr.Expr_.UnaryOperator,
        expr: toNamedExpr(expr.expr, reservedWord, identiferIndex),
        operator: expr.operator
      };
    case Expr_.BinaryOperator:
      return {
        _: namedExpr.Expr_.BinaryOperator,
        left: toNamedExpr(expr, reservedWord, identiferIndex),
        right: toNamedExpr(expr, reservedWord, identiferIndex),
        operator: expr.operator
      };
    case Expr_.ConditionalOperator:
      return {
        _: namedExpr.Expr_.ConditionalOperator,
        condition: toNamedExpr(expr, reservedWord, identiferIndex),
        elseExpr: toNamedExpr(expr, reservedWord, identiferIndex),
        thenExpr: toNamedExpr(expr, reservedWord, identiferIndex)
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
          typeExpr: typeExpr.toNamed(parameterType, reservedWord)
        });
      }
      return {
        _: namedExpr.Expr_.LambdaWithReturn,
        parameterList,
        returnType: typeExpr.toNamed(expr.returnType, reservedWord),
        statementList: toNamedStatementList(expr.statementList)
      };
    }
    case Expr_.LambdaReturnVoid:
      return {};
    case Expr_.GlobalVariable:
      return {};
    case Expr_.ImportedVariable:
      return {};
    case Expr_.Argument:
      return {};
    case Expr_.GetProperty:
      return {};
    case Expr_.Call:
      return {};
    case Expr_.New:
      return {};
    case Expr_.LocalVariable:
      return {};
  }
};

export const toNamedStatementList = (
  statementList: ReadonlyArray<Statement>
): ReadonlyArray<namedExpr.Statement> => {
  return [];
};
