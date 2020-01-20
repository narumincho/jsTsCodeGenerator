import * as reservedWord from "./reservedWord";
import * as scanType from "./scanType";
import * as typeExpr from "./typeExpr";

export type Expr =
  | { _: Expr_.NumberLiteral; value: string }
  | {
      _: Expr_.NumberOperator;
      operator: NumberOperatorOperator;
      left: Expr;
      right: Expr;
    }
  | {
      _: Expr_.StringLiteral;
      value: string;
    }
  | {
      _: Expr_.StringConcatenate;
      left: Expr;
      right: Expr;
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
      _: Expr_.ObjectLiteral;
      memberList: Map<string, Expr>;
    }
  | {
      _: Expr_.LambdaWithReturn;
      parameter: ReadonlyArray<typeExpr.OneParameter>;
      returnType: typeExpr.TypeExpr;
      body: Expr;
    }
  | {
      _: Expr_.LambdaReturnVoid;
      parameter: ReadonlyArray<typeExpr.OneParameter>;
      body: Expr;
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
      name: string;
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
      _: Expr_.IfWithVoidReturn;
      condition: Expr;
      then: Expr;
      else_: Expr;
    }
  | {
      _: Expr_.New;
      expr: Expr;
      parameterList: ReadonlyArray<Expr>;
    };

const enum Expr_ {
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
  IfWithVoidReturn,
  New
}

type NumberOperatorOperator = "+" | "-" | "*" | "/";

type ValueOf<T> = T[keyof T];

/**
 * 数値リテラル
 * @param value 値
 */
export const numberLiteral = (value: number): Expr => ({
  _: Expr_.NumberLiteral,
  value: value.toString()
});

/**
 * 文字列リテラル
 * @param string 文字列。エスケープする必要はない
 */
export const stringLiteral = (string: string): Expr => ({
  _: Expr_.StringLiteral,
  value: string
});

/**
 * 数値の足し算 ??? + ???
 * @param left 左辺
 * @param right 右辺
 */
export const add = (left: Expr, right: Expr): Expr => ({
  _: Expr_.NumberOperator,
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
  _: Expr_.NumberOperator,
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
  _: Expr_.NumberOperator,
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
  _: Expr_.NumberOperator,
  operator: "/",
  left: left,
  right: right
});

/**
 * オブジェクトリテラル
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
      [nameIndex in keyof parameterNameList & number]: Expr;
    }
  ) => Expr
): Expr => ({
  _: Expr_.LambdaWithReturn,
  parameter,
  returnType,
  body: body(
    parameter.map(
      (o: { name: ValueOf<parameterNameList> }) =>
        ({
          _: Expr_.Argument,
          name: o.name
        } as Expr)
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
      [nameIndex in keyof parameterNameList & number]: Expr;
    }
  ) => Expr
): Expr => ({
  _: Expr_.LambdaReturnVoid,
  parameter,
  body: body(
    parameter.map(
      (o: { name: ValueOf<parameterNameList> }) =>
        ({
          _: Expr_.Argument,
          name: o.name
        } as Expr)
    )
  )
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
 * 条件で分岐して、条件を満たしていた場合、早くreturnする
 * @param identiferIndex
 * @param reserved
 */
export const ifWithVoidReturn = (
  condition: Expr,
  then: Expr,
  else_: Expr
): Expr => ({
  _: Expr_.IfWithVoidReturn,
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
 * 式をコードに変換する
 * @param expr 式
 * @param importedModuleNameMap インポートされたモジュールのパスと名前空間識別子のマップ
 */
export const exprToString = (
  expr: Expr,
  importedModuleNameMap: Map<string, string>
): string => {
  switch (expr._) {
    case Expr_.NumberLiteral:
      return expr.value;

    case Expr_.NumberOperator:
      return (
        "(" +
        exprToString(expr.left, importedModuleNameMap) +
        expr.operator +
        exprToString(expr.right, importedModuleNameMap) +
        ")"
      );

    case Expr_.StringLiteral:
      return stringLiteralValueToString(expr.value);

    case Expr_.StringConcatenate:
      return (
        "(" +
        exprToString(expr.left, importedModuleNameMap) +
        "+" +
        exprToString(expr.right, importedModuleNameMap) +
        ")"
      );

    case Expr_.BooleanLiteral:
      return expr.value ? "true" : "false";

    case Expr_.UndefinedLiteral:
      return "void 0";

    case Expr_.NullLiteral:
      return "null";

    case Expr_.ObjectLiteral:
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
    case Expr_.LambdaWithReturn:
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

    case Expr_.LambdaReturnVoid:
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

    case Expr_.GlobalVariable:
      return expr.name;

    case Expr_.ImportedVariable: {
      const importedModuleName = importedModuleNameMap.get(expr.path);
      if (importedModuleName === undefined) {
        throw new Error("収集されなかったモジュールがある! path=" + expr.path);
      }
      return importedModuleName + "." + expr.name;
    }

    case Expr_.Argument:
      return expr.name;

    case Expr_.GetProperty:
      return (
        "(" +
        exprToString(expr.expr, importedModuleNameMap) +
        ")." +
        expr.propertyName
      );

    case Expr_.Call:
      return (
        exprToString(expr.expr, importedModuleNameMap) +
        "(" +
        expr.parameterList
          .map(e => exprToString(e, importedModuleNameMap))
          .join(", ") +
        ")"
      );

    case Expr_.IfWithVoidReturn:
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

    case Expr_.New:
      return (
        "new (" +
        exprToString(expr.expr, importedModuleNameMap) +
        ")(" +
        expr.parameterList
          .map(e => exprToString(e, importedModuleNameMap))
          .join(", ") +
        ")"
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
    case Expr_.NumberLiteral:
    case Expr_.NumberOperator:
    case Expr_.StringLiteral:
    case Expr_.BooleanLiteral:
    case Expr_.UndefinedLiteral:
    case Expr_.NullLiteral:
      return;

    case Expr_.ObjectLiteral:
      for (const [propertyName, member] of expr.memberList) {
        reservedWord.checkUsingReservedWord(
          "object literal property name",
          "オブジェクトリテラルのプロパティ名",
          propertyName
        );
        scanExpr(member, scanData);
      }
      return;

    case Expr_.LambdaWithReturn:
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

    case Expr_.LambdaReturnVoid:
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

    case Expr_.GlobalVariable:
      reservedWord.checkUsingReservedWord(
        "global variable name",
        "グローバル空間の変数名",
        expr.name
      );
      scanData.globalName.add(expr.name);
      return;

    case Expr_.ImportedVariable:
      reservedWord.checkUsingReservedWord(
        "imported variable name",
        "インポートした変数名",
        expr.name
      );
      scanData.importedModulePath.add(expr.path);
      return;

    case Expr_.Argument:
      reservedWord.checkUsingReservedWord(
        "argument name",
        "ラムダ式の引数の変数名",
        expr.name
      );
      scanData.globalName.add(expr.name);
      return;
    case Expr_.Call:
      scanExpr(expr.expr, scanData);
      for (const parameter of expr.parameterList) {
        scanExpr(parameter, scanData);
      }
      return;

    case Expr_.IfWithVoidReturn:
      scanExpr(expr.condition, scanData);
      scanExpr(expr.then, scanData);
      scanExpr(expr.else_, scanData);
      return;

    case Expr_.New:
      scanExpr(expr.expr, scanData);
      for (const parameter of expr.parameterList) {
        scanExpr(parameter, scanData);
      }
      return;
  }
};
