/**
 * 外部のモジュールを識別するためのID
 */
type ImportId = string & { _importId: never };

/**
 * 内部で使う変数の型を識別するためのID
 */
type VariableId = string & { _variableId: never };

/**
 * Node.js向けのコード。TypeScriptでも出力できるように型情報をつける必要がある
 */
export type NodeJsCode = {
  importList: ReadonlyArray<Import>;
  exportTypeAliasList: ReadonlyArray<ExportTypeAlias>;
  exportVariableList: ReadonlyArray<ExportVariable<TypeExpr>>;
};

type Import = {
  path: string;
  id: ImportId;
};

type ExportTypeAlias = {
  readonly name: string;
  readonly document: string;
  readonly typeExpr: TypeExpr;
};

type ExportVariable<typeExpr extends TypeExpr> = {
  readonly name: string;
  readonly typeExpr: typeExpr;
  readonly document: string;
  readonly expr: ExprFilterByType<typeExpr>;
};

type ModuleOrGlobalDefinition = {
  typeList: { [key in string]: TypeExpr };
  variableList: { [key in string]: TypeExpr };
};

type Global<definition extends ModuleOrGlobalDefinition> = {
  typeList: {
    [key in keyof definition["typeList"]]: {
      type: TypeExprType.GlobalType;
      name: key;
    };
  };
  variableList: {
    [key in keyof definition["variableList"]]: {
      type: ExprType.GlobalVariable;
      name: key;
      _type: definition["variableList"][key];
    };
  };
};

type Module<definition extends ModuleOrGlobalDefinition> = {
  typeList: {
    [key in keyof definition["typeList"]]: {
      type: TypeExprType.ImportedType;
      id: ImportId;
      name: key;
    };
  };
  variableList: {
    [key in keyof definition["variableList"]]: {
      type: ExprType.ImportedVariable;
      importId: ImportId;
      name: key;
      _type: definition["variableList"][key];
    };
  };
};

/* ======================================================================================
 *                                      Type Expr
 * ====================================================================================== */

/**
 * 型の式 {id:string | number} みたいな
 */
export type TypeExpr =
  | TypePrimitive
  | TypeObject
  | TypeFunction
  | TypeUnion
  | TypeImported
  | TypeGlobal;

const enum TypeExprType {
  Primitive,
  Object,
  Function,
  Union,
  ImportedType,
  GlobalType
}

type TypePrimitive = {
  type: TypeExprType.Primitive;
  typeType: PrimitiveTypeType;
};

const enum PrimitiveTypeType {
  Number,
  String,
  Boolean,
  Undefined,
  Null
}

type TypeObject = {
  type: TypeExprType.Object;
  memberList: {
    [name in string]: { typeExpr: TypeExpr; document: string };
  };
};

type TypeFunction = {
  type: TypeExprType.Function;
  return?: TypeExpr;
} & (
  | { typeType: FunctionTypeType.Parameter0 }
  | {
      typeType: FunctionTypeType.Parameter1;
      parameter0: Parameter;
    }
  | {
      typeType: FunctionTypeType.Parameter2;
      parameter0: Parameter;
      parameter1: Parameter;
    }
  | {
      typeType: FunctionTypeType.Parameter3;
      parameter0: Parameter;
      parameter1: Parameter;
      parameter2: Parameter;
    }
  | {
      typeType: FunctionTypeType.Parameter4;
      parameter0: Parameter;
      parameter1: Parameter;
      parameter2: Parameter;
      parameter3: Parameter;
    }
  | {
      typeType: FunctionTypeType.Parameter5;
      parameter0: Parameter;
      parameter1: Parameter;
      parameter2: Parameter;
      parameter3: Parameter;
      parameter4: Parameter;
    }
  | {
      typeType: FunctionTypeType.Parameter6;
      parameter0: Parameter;
      parameter1: Parameter;
      parameter2: Parameter;
      parameter3: Parameter;
      parameter4: Parameter;
      parameter5: Parameter;
    }
  | {
      typeType: FunctionTypeType.Parameter7;
      parameter0: Parameter;
      parameter1: Parameter;
      parameter2: Parameter;
      parameter3: Parameter;
      parameter4: Parameter;
      parameter5: Parameter;
      parameter6: Parameter;
    }
);

const enum FunctionTypeType {
  Parameter0,
  Parameter1,
  Parameter2,
  Parameter3,
  Parameter4,
  Parameter5,
  Parameter6,
  Parameter7
}

type Parameter = {
  name: string;
  document: string;
  typeExpr: TypeExpr;
};

type TypeUnion = { type: TypeExprType.Union; types: ReadonlyArray<TypeExpr> };

type TypeImported = {
  type: TypeExprType.ImportedType;
  id: ImportId;
  typeExpr: TypeExpr;
  name: string;
};

type TypeGlobal = { type: TypeExprType.GlobalType; name: string };

/**
 * プリミティブの型のnumber
 */
export const typeNumber = {
  type: TypeExprType.Primitive,
  typeType: PrimitiveTypeType.Number
} as const;

/**
 * プリミティブの型のstring
 */
export const typeString = {
  type: TypeExprType.Primitive,
  typeType: PrimitiveTypeType.String
} as const;

/**
 * プリミティブの型のboolean
 */
export const typeBoolean = {
  type: TypeExprType.Primitive,
  typeType: PrimitiveTypeType.Boolean
} as const;

/**
 * プリミティブの型のundefined
 */
export const typeUndefined = {
  type: TypeExprType.Primitive,
  typeType: PrimitiveTypeType.Undefined
} as const;

/**
 * プリミティブの型のnull
 */
export const typeNull = {
  type: TypeExprType.Primitive,
  typeType: PrimitiveTypeType.Null
} as const;
/* ======================================================================================
 *                                        Expr
 * ====================================================================================== */

type ExprFilterByType<typeExpr extends TypeExpr> =
  | (typeExpr extends TypePrimitive
      ? typeExpr["typeType"] extends PrimitiveTypeType.Number
        ? NumberLiteral | NumberOperator
        : typeExpr["typeType"] extends PrimitiveTypeType.String
        ? StringLiteral | StringConcatenate
        : typeExpr["typeType"] extends PrimitiveTypeType.Boolean
        ? BooleanLiteral
        : typeExpr["typeType"] extends PrimitiveTypeType.Undefined
        ? UndefinedLiteral
        : typeExpr["typeType"] extends PrimitiveTypeType.Null
        ? NullLiteral
        : never
      : typeExpr extends TypeObject
      ? ObjectLiteral<typeExpr>
      : never)
  | GlobalVariable<typeExpr>
  | ImportedVariable<typeExpr>;

type Expr =
  | NumberLiteral
  | NumberOperator
  | StringLiteral
  | StringConcatenate
  | BooleanLiteral
  | NullLiteral
  | UndefinedLiteral
  | ObjectLiteral<TypeObject>
  | GlobalVariable<TypeExpr>
  | ImportedVariable<TypeExpr>;

const enum ExprType {
  NumberLiteral,
  NumberOperator,
  StringLiteral,
  StringConcatenate,
  BooleanLiteral,
  UndefinedLiteral,
  NullLiteral,
  ObjectLiteral,
  GlobalVariable,
  ImportedVariable
}

type NumberLiteral = {
  type: ExprType.NumberLiteral;
  value: string;
};

type NumberOperator = {
  type: ExprType.NumberOperator;
  operator: NumberOperatorOperator;
  left: ExprFilterByType<typeof typeNumber>;
  right: ExprFilterByType<typeof typeNumber>;
};

type NumberOperatorOperator = "+" | "-" | "*" | "/";

type StringLiteral = {
  type: ExprType.StringLiteral;
  value: string;
};

type StringConcatenate = {
  type: ExprType.StringConcatenate;
  left: ExprFilterByType<typeof typeString>;
  right: ExprFilterByType<typeof typeString>;
};

type BooleanLiteral = {
  type: ExprType.BooleanLiteral;
  value: boolean;
};

type NullLiteral = {
  type: ExprType.NullLiteral;
};

type UndefinedLiteral = {
  type: ExprType.UndefinedLiteral;
};

type ObjectLiteral<T extends TypeObject> = {
  type: ExprType.ObjectLiteral;
  values: {
    [key in keyof T["memberList"]]: ExprFilterByType<
      T["memberList"][key]["typeExpr"]
    >;
  };
};

type GlobalVariable<typeExpr extends TypeExpr> = {
  type: ExprType.GlobalVariable;
  typeExpr: typeExpr;
  name: string;
};

type ImportedVariable<typeExpr extends TypeExpr> = {
  type: ExprType.ImportedVariable;
  typeExpr: typeExpr;
  importId: ImportId;
  name: string;
};

/* ======================================================================================
 *                                      Module
 * ====================================================================================== */

const objectMap = <objectKeys extends string, input, output>(
  input: { [key in objectKeys]: input },
  func: (key: objectKeys, input: input) => output
): { [key in objectKeys]: output } =>
  Object.entries<input>(input).reduce(
    (previous, [key, value]) => ({
      ...previous,
      [key]: func(key as objectKeys, value)
    }),
    {} as { [key in objectKeys]: output }
  );

const globalDefinitionToGlobal = <
  moduleDefinition extends ModuleOrGlobalDefinition
>(
  moduleDefinition: moduleDefinition
): Global<moduleDefinition> => ({
  typeList: objectMap(moduleDefinition.typeList, (name, _typeExpr) => ({
    type: TypeExprType.GlobalType,
    name: name
  })) as Global<moduleDefinition>["typeList"],
  variableList: objectMap(moduleDefinition.variableList, (name, typeExpr) => ({
    type: ExprType.GlobalVariable,
    name: name,
    _type: typeExpr
  })) as Global<moduleDefinition>["variableList"]
});

/**
 * グローバル空間の型と変数の型情報を渡して使えるようにする
 * @param global グローバル空間の型と変数の型情報
 * @param body コード本体
 */
export const addGlobal = <
  globalModuleDefinition extends ModuleOrGlobalDefinition
>(
  global: globalModuleDefinition,
  body: (global: Global<globalModuleDefinition>) => NodeJsCode
): NodeJsCode => body(globalDefinitionToGlobal(global));

const moduleDefinitionToModule = <
  moduleDefinition extends ModuleOrGlobalDefinition
>(
  moduleDefinition: moduleDefinition,
  importId: ImportId
): Module<moduleDefinition> => ({
  typeList: objectMap(moduleDefinition.typeList, (name, _typeExpr) => ({
    type: TypeExprType.ImportedType,
    id: importId,
    name: name
  })) as Module<moduleDefinition>["typeList"],
  variableList: objectMap(moduleDefinition.variableList, (name, typeExpr) => ({
    type: ExprType.ImportedVariable,
    importId: importId,
    name: name,
    _type: typeExpr
  })) as Module<moduleDefinition>["variableList"]
});

/**
 * Node.js向けの外部のライブラリをimportして使えるようにする
 * @param path パス
 * @param moduleDefinition モジュールの公開している型と変数の型情報
 * @param rootIdentiferIndex 識別子を生成するためのインデックス
 * @param body コード本体
 */
export const importNodeModule = <
  moduleDefinition extends ModuleOrGlobalDefinition
>(
  path: string,
  moduleDefinition: moduleDefinition,
  rootIdentiferIndex: number,
  body: (module: Module<moduleDefinition>) => NodeJsCode
): { code: NodeJsCode; identiferIndex: number } => {
  const importIdentiferData = createIdentifer(rootIdentiferIndex, []);
  const importId = importIdentiferData.string as ImportId;
  const code = body(moduleDefinitionToModule(moduleDefinition, importId));
  return {
    code: {
      ...code,
      importList: code.importList.concat([
        {
          id: importId,
          path: path
        }
      ])
    },
    identiferIndex: importIdentiferData.nextIndex
  };
};

/**
 * 外部に公開する変数を定義する
 * @param name 変数名
 * @param typeExpr 型
 * @param expr 式
 * @param document ドキュメント
 * @param body コード本体
 */
export const addExportVariable = <
  name extends string,
  typeExpr extends TypeExpr
>(
  name: name,
  typeExpr: typeExpr,
  expr: ExprFilterByType<typeExpr>,
  document: string,
  body: (variable: {
    type: ExprType.GlobalVariable;
    name: string;
    _type: typeExpr;
  }) => NodeJsCode
): NodeJsCode => {
  const code = body({
    type: ExprType.GlobalVariable,
    name: name,
    _type: typeExpr
  });
  return {
    ...code,
    exportVariableList: code.exportVariableList.concat({
      name: name,
      typeExpr: typeExpr,
      expr: expr,
      document: document
    })
  };
};
/**
 * 空のNode.js用コード
 */
export const emptyNodeJsCode: NodeJsCode = {
  importList: [],
  exportTypeAliasList: [],
  exportVariableList: []
};

export const numberLiteral = (value: string): NumberLiteral => ({
  type: ExprType.NumberLiteral,
  value: value
});

/**
 * 文字列リテラル
 * @param string 文字列。エスケープする必要はない
 */
export const stringLiteral = (string: string): StringLiteral => ({
  type: ExprType.StringLiteral,
  value: string
});
/**
 * 数値の足し算 ??? + ???
 * @param left 左辺
 * @param right 右辺
 */
export const add = (
  left: ExprFilterByType<typeof typeNumber>,
  right: ExprFilterByType<typeof typeNumber>
): NumberOperator => ({
  type: ExprType.NumberOperator,
  operator: "+",
  left: left,
  right: right
});

/**
 * 数値の引き算
 * @param left 左辺
 * @param right 右辺
 */
export const sub = (
  left: ExprFilterByType<typeof typeNumber>,
  right: ExprFilterByType<typeof typeNumber>
): NumberOperator => ({
  type: ExprType.NumberOperator,
  operator: "-",
  left: left,
  right: right
});

/**
 * 数値の掛け算
 * @param left 左辺
 * @param right 右辺
 */
export const mul = (
  left: ExprFilterByType<typeof typeNumber>,
  right: ExprFilterByType<typeof typeNumber>
): NumberOperator => ({
  type: ExprType.NumberOperator,
  operator: "*",
  left: left,
  right: right
});

/**
 * 数値の割り算
 * @param left 左辺
 * @param right 右辺
 */
export const div = (
  left: ExprFilterByType<typeof typeNumber>,
  right: ExprFilterByType<typeof typeNumber>
): NumberOperator => ({
  type: ExprType.NumberOperator,
  operator: "/",
  left: left,
  right: right
});

/**
 * 識別子を生成する
 */
const createIdentifer = (
  index: number,
  reserved: ReadonlyArray<string>
): { string: string; nextIndex: number } => {
  while (true) {
    const result = createIdentiferByIndex(index);
    if (reserved.includes(result)) {
      index += 1;
      continue;
    }
    return { string: result, nextIndex: index + 1 };
  }
};

/**
 * indexから識別子を生成する (予約語を考慮しない)
 * @param index
 */
const createIdentiferByIndex = (index: number): string => {
  const headIdentiferCharTable =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const noHeadIdentiferCharTable = headIdentiferCharTable + "0123456789";
  if (index < headIdentiferCharTable.length) {
    return headIdentiferCharTable[index];
  }
  let result = "";
  index -= headIdentiferCharTable.length;
  while (true) {
    const quotient = Math.floor(index / noHeadIdentiferCharTable.length);
    const remainder = index % noHeadIdentiferCharTable.length;
    if (quotient < headIdentiferCharTable.length) {
      return (
        headIdentiferCharTable[quotient] +
        noHeadIdentiferCharTable[remainder] +
        result
      );
    }
    result = noHeadIdentiferCharTable[remainder] + result;
    index = quotient;
  }
};

const primitiveTypeToString = (primitiveType: TypePrimitive): string => {
  switch (primitiveType.typeType) {
    case PrimitiveTypeType.String:
      return "string";
    case PrimitiveTypeType.Number:
      return "number";
    case PrimitiveTypeType.Boolean:
      return "boolean";
    case PrimitiveTypeType.Null:
      return "null";
    case PrimitiveTypeType.Undefined:
      return "undefined";
  }
};

/** 関数の引数と戻り値の型を文字列にする */
const parameterAndReturnToString = (
  parameterList: ReadonlyArray<Parameter>,
  returnType: TypeExpr | undefined
): string =>
  "(" +
  parameterList
    .map(parameter => typeExprToString(parameter.typeExpr))
    .join(",") +
  ")=>" +
  (returnType === undefined ? "void" : typeExprToString(returnType));

/** 関数の型を文字列にする */
const functionTypeExprToString = (functionType: TypeFunction): string => {
  switch (functionType.typeType) {
    case FunctionTypeType.Parameter0:
      return parameterAndReturnToString([], functionType.return);
    case FunctionTypeType.Parameter1:
      return parameterAndReturnToString(
        [functionType.parameter0],
        functionType.return
      );
    case FunctionTypeType.Parameter2:
      return parameterAndReturnToString(
        [functionType.parameter0, functionType.parameter1],
        functionType.return
      );
    case FunctionTypeType.Parameter3:
      return parameterAndReturnToString(
        [
          functionType.parameter0,
          functionType.parameter1,
          functionType.parameter2
        ],
        functionType.return
      );
    case FunctionTypeType.Parameter4:
      return parameterAndReturnToString(
        [
          functionType.parameter0,
          functionType.parameter1,
          functionType.parameter2,
          functionType.parameter3
        ],
        functionType.return
      );
    case FunctionTypeType.Parameter5:
      return parameterAndReturnToString(
        [
          functionType.parameter0,
          functionType.parameter1,
          functionType.parameter2,
          functionType.parameter3,
          functionType.parameter4
        ],
        functionType.return
      );
    case FunctionTypeType.Parameter6:
      return parameterAndReturnToString(
        [
          functionType.parameter0,
          functionType.parameter1,
          functionType.parameter2,
          functionType.parameter3,
          functionType.parameter4,
          functionType.parameter5
        ],
        functionType.return
      );
    case FunctionTypeType.Parameter7:
      return parameterAndReturnToString(
        [
          functionType.parameter0,
          functionType.parameter1,
          functionType.parameter2,
          functionType.parameter3,
          functionType.parameter4,
          functionType.parameter4,
          functionType.parameter5,
          functionType.parameter6
        ],
        functionType.return
      );
  }
};

/** 型の式をコードに表す */
const typeExprToString = (typeExpr: TypeExpr): string => {
  switch (typeExpr.type) {
    case TypeExprType.Primitive:
      return primitiveTypeToString(typeExpr);
    case TypeExprType.Object:
      return (
        "{" +
        Object.entries(typeExpr.memberList)
          .map(
            ([name, typeAndDocument]) =>
              name + ":" + typeExprToString(typeAndDocument.typeExpr)
          )
          .join(",") +
        "}"
      );
    case TypeExprType.Function:
      return functionTypeExprToString(typeExpr);
    case TypeExprType.Union:
      return typeExpr.types.map(typeExprToString).join("|");
    case TypeExprType.ImportedType:
      return (typeExpr.id as string) + "." + typeExpr.name;
    case TypeExprType.GlobalType:
      return typeExpr.name;
  }
};

const exprToString = (expr: Expr): string => {
  switch (expr.type) {
    case ExprType.NumberLiteral:
      return expr.value;
    case ExprType.NumberOperator:
      return (
        "(" +
        exprToString(expr.left) +
        expr.operator +
        exprToString(expr.right) +
        ")"
      );

    case ExprType.StringLiteral:
      return '"' + expr.value + '"';
    case ExprType.StringConcatenate:
      return (
        "(" + exprToString(expr.left) + "+" + exprToString(expr.right) + ")"
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
        Object.entries(expr.values)
          .map(([key, value]) => key + ":" + exprToString(value))
          .join(",") +
        "}"
      );
    case ExprType.GlobalVariable:
      return expr.name;
    case ExprType.ImportedVariable:
      return (expr.importId as string) + "." + expr.name;
  }
};

export const toNodeJsCodeAsTypeScript = (nodeJsCode: NodeJsCode): string =>
  nodeJsCode.importList
    .map(
      importNodeModule =>
        "import * as " +
        (importNodeModule.id as string) +
        ' from "' +
        importNodeModule.path +
        '"'
    )
    .join(";") +
  ";" +
  nodeJsCode.exportTypeAliasList
    .map(
      exportTypeAlias =>
        "type " +
        exportTypeAlias.name +
        " = " +
        typeExprToString(exportTypeAlias.typeExpr)
    )
    .join(";") +
  nodeJsCode.exportVariableList
    .map(
      exportVariable =>
        "const " +
        exportVariable.name +
        ":" +
        typeExprToString(exportVariable.typeExpr) +
        "=" +
        exprToString(exportVariable.expr)
    )
    .join(";");
