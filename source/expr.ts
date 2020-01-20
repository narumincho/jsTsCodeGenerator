import * as typeExpr from "./typeExpr";
import * as reservedWord from "./reservedWord";
import * as scanType from "./scanType";

export type Expr =
  | NumberLiteral
  | NumberOperator
  | StringLiteral
  | StringConcatenate
  | BooleanLiteral
  | NullLiteral
  | UndefinedLiteral
  | ObjectLiteral
  | LambdaWithReturn
  | LambdaReturnVoid
  | GlobalVariable
  | ImportedVariable
  | ArgumentVariable
  | GetProperty
  | Call
  | IfWithVoidReturn;

const enum ExprType {
  NumberLiteral,
  NumberOperator,
  StringLiteral,
  StringConcatenate,
  BooleanLiteral,
  UndefinedLiteral,
  NullLiteral,
  ObjectLiteral,
  LambdaWithReturn,
  LambdaReturnVoid,
  GlobalVariable,
  ImportedVariable,
  Argument,
  GetProperty,
  Call,
  IfWithVoidReturn
}

type NumberLiteral = {
  _: ExprType.NumberLiteral;
  value: string;
};

type NumberOperator = {
  _: ExprType.NumberOperator;
  operator: NumberOperatorOperator;
  left: Expr;
  right: Expr;
};

type NumberOperatorOperator = "+" | "-" | "*" | "/";

type StringLiteral = {
  _: ExprType.StringLiteral;
  value: string;
};

type StringConcatenate = {
  _: ExprType.StringConcatenate;
  left: Expr;
  right: Expr;
};

type BooleanLiteral = {
  _: ExprType.BooleanLiteral;
  value: boolean;
};

type NullLiteral = {
  _: ExprType.NullLiteral;
};

type UndefinedLiteral = {
  _: ExprType.UndefinedLiteral;
};

type ObjectLiteral = {
  _: ExprType.ObjectLiteral;
  memberList: Map<string, Expr>;
};

type LambdaWithReturn = {
  _: ExprType.LambdaWithReturn;
  parameter: ReadonlyArray<typeExpr.OneParameter>;
  returnType: typeExpr.TypeExpr;
  body: Expr;
};

type LambdaReturnVoid = {
  _: ExprType.LambdaReturnVoid;
  parameter: ReadonlyArray<typeExpr.OneParameter>;
  body: Expr;
};

type GlobalVariable = {
  _: ExprType.GlobalVariable;
  name: string;
};

type ImportedVariable = {
  _: ExprType.ImportedVariable;
  path: string;
  name: string;
};

type ArgumentVariable = {
  _: ExprType.Argument;
  name: string;
};

type GetProperty = {
  _: ExprType.GetProperty;
  expr: Expr;
  propertyName: string;
};

type Call = {
  _: ExprType.Call;
  expr: Expr;
  parameterList: ReadonlyArray<Expr>;
};

type IfWithVoidReturn = {
  _: ExprType.IfWithVoidReturn;
  condition: Expr;
  then: Expr;
  else_: Expr;
};

type ValueOf<T> = T[keyof T];

/**
 * 数値リテラル
 * @param value 値
 */
export const numberLiteral = (value: number): Expr => ({
  _: ExprType.NumberLiteral,
  value: value.toString()
});

/**
 * 文字列リテラル
 * @param string 文字列。エスケープする必要はない
 */
export const stringLiteral = (string: string): Expr => ({
  _: ExprType.StringLiteral,
  value: string
});

/**
 * 数値の足し算 ??? + ???
 * @param left 左辺
 * @param right 右辺
 */
export const add = (left: Expr, right: Expr): Expr => ({
  _: ExprType.NumberOperator,
  operator: "+",
  left: left,
  right: right
});

/**
 * 数値の引き算
 * @param left 左辺
 * @param right 右辺
 */
export const sub = (left: Expr, right: Expr): Expr => ({
  _: ExprType.NumberOperator,
  operator: "-",
  left: left,
  right: right
});

/**
 * 数値の掛け算
 * @param left 左辺
 * @param right 右辺
 */
export const mul = (left: Expr, right: Expr): Expr => ({
  _: ExprType.NumberOperator,
  operator: "*",
  left: left,
  right: right
});

/**
 * 数値の割り算
 * @param left 左辺
 * @param right 右辺
 */
export const division = (left: Expr, right: Expr): Expr => ({
  _: ExprType.NumberOperator,
  operator: "/",
  left: left,
  right: right
});

/**
 * オブジェクトリテラル
 */
export const createObjectLiteral = (memberList: Map<string, Expr>): Expr => {
  return {
    _: ExprType.ObjectLiteral,
    memberList: memberList
  };
};

/**
 * 戻り値のあるラムダ式
 * @param parameter パラメーター
 * @param returnType 戻り値
 * @param body 本体
 */
export const createLambdaWithReturn = <
  parameterNameList extends ReadonlyArray<string>
>(
  parameter: Array<
    ValueOf<
      {
        [nameIndex in keyof parameterNameList &
          number]: typeExpr.OneParameter & {
          name: parameterNameList[nameIndex];
        };
      }
    >
  >,
  returnType: typeExpr.TypeExpr,
  body: (
    parameterList: {
      [nameIndex in keyof parameterNameList & number]: ArgumentVariable & {
        name: parameterNameList[nameIndex];
      };
    }
  ) => Expr
): Expr => ({
  _: ExprType.LambdaWithReturn,
  parameter,
  returnType,
  body: body(
    parameter.map(
      (o: { name: ValueOf<parameterNameList> }) =>
        ({
          _: ExprType.Argument,
          name: o.name
        } as ArgumentVariable)
    )
  )
});

/**
 * 戻り値のないラムダ式
 * @param parameter パラメーター
 * @param body 本体
 */
export const createLambdaReturnVoid = <
  parameterNameList extends ReadonlyArray<string>
>(
  parameter: Array<
    ValueOf<
      {
        [nameIndex in keyof parameterNameList &
          number]: typeExpr.OneParameter & {
          name: parameterNameList[nameIndex];
        };
      }
    >
  >,
  body: (
    parameterList: {
      [nameIndex in keyof parameterNameList & number]: ArgumentVariable & {
        name: parameterNameList[nameIndex];
      };
    }
  ) => Expr
): Expr => ({
  _: ExprType.LambdaReturnVoid,
  parameter,
  body: body(
    parameter.map(
      (o: { name: ValueOf<parameterNameList> }) =>
        ({
          _: ExprType.Argument,
          name: o.name
        } as ArgumentVariable)
    )
  )
});

/**
 * プロパティの値を取得する
 * @param expr 式
 * @param propertyName プロパティ
 */
export const getProperty = (expr: Expr, propertyName: string): Expr => ({
  _: ExprType.GetProperty,
  expr,
  propertyName
});

/**
 * 関数を呼ぶ
 * @param expr 式
 * @param parameterList パラメーターのリスト
 */
export const call = (expr: Expr, parameterList: ReadonlyArray<Expr>): Expr => ({
  _: ExprType.Call,
  expr,
  parameterList
});

/**
 * 条件で分岐して、条件を満たしていた場合、早くreturnする
 * @param identiferIndex
 * @param reserved
 */
export const ifWithVoidReturn = (
  condition: Expr,
  then: Expr,
  else_: Expr
): Expr => ({
  _: ExprType.IfWithVoidReturn,
  condition,
  then,
  else_
});

/**
 * インポートした変数
 * @param path モジュールのパス
 * @param name 変数名
 */
export const importedVariable = (path: string, name: string): Expr => ({
  _: ExprType.ImportedVariable,
  name,
  path
});

/**
 * グローバル空間にある変数
 * @param name 変数名
 */
export const globalVariable = (name: string): Expr => ({
  _: ExprType.GlobalVariable,
  name
});

/**
 * 式をコードに変換する
 * @param expr 式
 * @param importedModuleNameMap インポートされたモジュールのパスと名前空間識別子のマップ
 */
export const exprToString = (
  expr: Expr,
  importedModuleNameMap: Map<string, string>
): string => {
  switch (expr._) {
    case ExprType.NumberLiteral:
      return expr.value;

    case ExprType.NumberOperator:
      return (
        "(" +
        exprToString(expr.left, importedModuleNameMap) +
        expr.operator +
        exprToString(expr.right, importedModuleNameMap) +
        ")"
      );

    case ExprType.StringLiteral:
      return stringLiteralValueToString(expr.value);

    case ExprType.StringConcatenate:
      return (
        "(" +
        exprToString(expr.left, importedModuleNameMap) +
        "+" +
        exprToString(expr.right, importedModuleNameMap) +
        ")"
      );

    case ExprType.BooleanLiteral:
      return expr.value ? "true" : "false";

    case ExprType.UndefinedLiteral:
      return "void 0";

    case ExprType.NullLiteral:
      return "null";

    case ExprType.ObjectLiteral:
      return (
        "{" +
        [...expr.memberList.entries()]
          .map(
            ([key, value]) =>
              key + ":" + exprToString(value, importedModuleNameMap)
          )
          .join(", ") +
        "}"
      );
    case ExprType.LambdaWithReturn:
      return (
        "(" +
        expr.parameter
          .map(
            o =>
              o.name +
              ": " +
              typeExpr.typeExprToString(o.typeExpr, importedModuleNameMap)
          )
          .join(", ") +
        "): " +
        typeExpr.typeExprToString(expr.returnType, importedModuleNameMap) +
        "=>" +
        exprToString(expr.body, importedModuleNameMap)
      );

    case ExprType.LambdaReturnVoid:
      return (
        "(" +
        expr.parameter
          .map(
            o =>
              o.name +
              ": " +
              typeExpr.typeExprToString(o.typeExpr, importedModuleNameMap)
          )
          .join(",") +
        "): void=>" +
        exprToString(expr.body, importedModuleNameMap)
      );

    case ExprType.GlobalVariable:
      return expr.name;

    case ExprType.ImportedVariable: {
      const importedModuleName = importedModuleNameMap.get(expr.path);
      if (importedModuleName === undefined) {
        throw new Error("収集されなかったモジュールがある! path=" + expr.path);
      }
      return importedModuleName + "." + expr.name;
    }

    case ExprType.Argument:
      return expr.name;

    case ExprType.GetProperty:
      return (
        "(" +
        exprToString(expr.expr, importedModuleNameMap) +
        ")." +
        expr.propertyName
      );

    case ExprType.Call:
      return (
        exprToString(expr.expr, importedModuleNameMap) +
        "(" +
        expr.parameterList
          .map(e => exprToString(e, importedModuleNameMap))
          .join(", ") +
        ")"
      );

    case ExprType.IfWithVoidReturn:
      return (
        "{\nif(" +
        exprToString(expr.condition, importedModuleNameMap) +
        "){" +
        exprToString(expr.then, importedModuleNameMap) +
        ";\n  return;" +
        "}\n" +
        exprToString(expr.else_, importedModuleNameMap) +
        "}"
      );
  }
};

const stringLiteralValueToString = (value: string): string => {
  return '"' + value.replace(/"/gu, '\\"').replace(/\n/gu, "\\n") + '"';
};

/**
 * 名前をつけたり、するために式を走査する
 * @param expr 式
 * @param scanData グローバルで使われている名前の集合などのコード全体の情報の収集データ。上書きする
 */
export const scanExpr = (
  expr: Expr,
  scanData: scanType.NodeJsCodeScanData
): void => {
  switch (expr._) {
    case ExprType.NumberLiteral:
    case ExprType.NumberOperator:
    case ExprType.StringLiteral:
    case ExprType.BooleanLiteral:
    case ExprType.UndefinedLiteral:
    case ExprType.NullLiteral:
      return;

    case ExprType.ObjectLiteral:
      for (const [propertyName, member] of expr.memberList) {
        reservedWord.checkUsingReservedWord(
          "object literal property name",
          "オブジェクトリテラルのプロパティ名",
          propertyName
        );
        scanExpr(member, scanData);
      }
      return;

    case ExprType.LambdaWithReturn:
      for (const oneParameter of expr.parameter) {
        reservedWord.checkUsingReservedWord(
          "function parameter name",
          "関数のパラメーター名",
          oneParameter.name
        );
        typeExpr.scan(oneParameter.typeExpr, scanData);
      }
      typeExpr.scan(expr.returnType, scanData);
      scanExpr(expr.body, scanData);
      return;

    case ExprType.LambdaReturnVoid:
      for (const oneParameter of expr.parameter) {
        reservedWord.checkUsingReservedWord(
          "function parameter name",
          "関数のパラメーター名",
          oneParameter.name
        );
        typeExpr.scan(oneParameter.typeExpr, scanData);
      }
      scanExpr(expr.body, scanData);
      return;

    case ExprType.GlobalVariable:
      reservedWord.checkUsingReservedWord(
        "global variable name",
        "グローバル空間の変数名",
        expr.name
      );
      scanData.globalName.add(expr.name);
      return;

    case ExprType.ImportedVariable:
      reservedWord.checkUsingReservedWord(
        "imported variable name",
        "インポートした変数名",
        expr.name
      );
      scanData.importedModulePath.add(expr.path);
      return;

    case ExprType.Argument:
      reservedWord.checkUsingReservedWord(
        "argument name",
        "ラムダ式の引数の変数名",
        expr.name
      );
      scanData.globalName.add(expr.name);
      return;

    case ExprType.IfWithVoidReturn:
      scanExpr(expr.condition, scanData);
      scanExpr(expr.then, scanData);
      scanExpr(expr.else_, scanData);
      return;
  }
};
