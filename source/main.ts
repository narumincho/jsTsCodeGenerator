/**
 * 外部のモジュールを識別するためのID
 */
type ImportId = string & { _importId: never };

/**
 * 外部の型を識別するためのID
 */
type TypeId = string & { _typeId: never };

/**
 * 変数の型を識別するためのID
 */
type VariableId = string & { _variableId: never };

/**
 * Node.js向けのコード。TypeScriptでも出力できるように型情報をつける必要がある
 */
type NodeJsCodeWithId = {
  globalType: { [key in string]: TypeExpr };
  globalVariable: { [key in string]: TypeExpr };
  importList: ReadonlyArray<Import>;
  exportTypeAliasList: ReadonlyArray<ExportTypeAliasWithId>;
  exportVariableList: ReadonlyArray<ExportVariableWithId>;
};

type Import = {
  path: string;
  id: ImportId;
};

type ExportTypeAliasWithId = {
  readonly id: string;
  readonly name: string;
  readonly document: string;
  readonly typeExpr: TypeExpr;
};

type ExportVariableWithId = {
  readonly id: string;
  readonly name: string;
  readonly document: string;
  readonly expr: Expr<TypeExpr>;
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
  | { type: TypeExprType.Primitive; primitive: PrimitiveType }
  | {
      type: TypeExprType.Object;
      memberList: {
        [name in string]: { typeExpr: TypeExpr; document: string };
      };
    }
  | {
      type: TypeExprType.Function;
      functionType: FunctionType;
    }
  | { type: TypeExprType.Union; types: ReadonlyArray<TypeExpr> }
  | { type: TypeExprType.ImportedType; id: ImportId; name: string }
  | { type: TypeExprType.GlobalType; name: string };

const enum TypeExprType {
  Primitive,
  Object,
  Function,
  Union,
  ImportedType,
  GlobalType
}

const enum PrimitiveType {
  String,
  Number,
  Boolean,
  Undefined,
  Null
}

/**
 * プリミティブの型のnumber
 */
export const number = {
  type: TypeExprType.Primitive,
  primitive: PrimitiveType.Number
} as const;

/**
 * プリミティブの型のstring
 */
export const string = {
  type: TypeExprType.Primitive,
  primitive: PrimitiveType.String
} as const;

type FunctionType = {
  return: TypeExpr;
} & (
  | { type: FunctionTypeType.Parameter0 }
  | {
      type: FunctionTypeType.Parameter1;
      parameter0: Parameter;
    }
  | {
      type: FunctionTypeType.Parameter2;
      parameter0: Parameter;
      parameter1: Parameter;
    }
  | {
      type: FunctionTypeType.Parameter3;
      parameter0: Parameter;
      parameter1: Parameter;
      parameter2: Parameter;
    }
  | {
      type: FunctionTypeType.Parameter4;
      parameter0: Parameter;
      parameter1: Parameter;
      parameter2: Parameter;
      parameter3: Parameter;
    }
  | {
      type: FunctionTypeType.Parameter5;
      parameter0: Parameter;
      parameter1: Parameter;
      parameter2: Parameter;
      parameter3: Parameter;
      parameter4: Parameter;
    }
  | {
      type: FunctionTypeType.Parameter6;
      parameter0: Parameter;
      parameter1: Parameter;
      parameter2: Parameter;
      parameter3: Parameter;
      parameter4: Parameter;
      parameter5: Parameter;
    }
  | {
      type: FunctionTypeType.Parameter7;
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
/* ======================================================================================
 *                                        Expr
 * ====================================================================================== */

type Expr<type extends TypeExpr> =
  | (type extends {
      type: TypeExprType.Primitive;
      primitive: infer primitive;
    }
      ?
          | (primitive extends PrimitiveType.Number
              ? NumberLiteral | NumberOperator
              : never)
          | (primitive extends PrimitiveType.String
              ? StringLiteral | StringConcatenate
              : never)
          | (primitive extends PrimitiveType.Boolean ? BooleanLiteral : never)
          | (primitive extends PrimitiveType.Null ? NullLiteral : never)
          | (primitive extends PrimitiveType.Undefined
              ? UndefinedLiteral
              : never)
      : never)
  | (type extends {
      type: TypeExprType.Object;
      memberList: {
        [name in string]: { typeExpr: TypeExpr; document: string };
      };
    }
      ? ObjectLiteral<
          {
            [key in keyof type["memberList"]]: type["memberList"][key]["typeExpr"];
          }
        >
      : never)
  | (type extends {
      type: TypeExprType.Function;
      parameterList: ReadonlyArray<{
        name: string;
        typeExpr: TypeExpr;
        document: string;
      }>;
      return: TypeExpr;
    }
      ? Lambda<type["parameterList"], type["return"]>
      : never)
  | GlobalVariable<type>
  | ImportedVariable<type>;

const enum ExprType {
  NumberLiteral,
  NumberOperator,
  StringLiteral,
  StringConcatenate,
  BooleanLiteral,
  NullLiteral,
  UndefinedLiteral,
  ObjectLiteral,
  GlobalVariable,
  ImportedVariable,
  Lambda
}

type NumberLiteral = { type: ExprType.NumberLiteral; value: string };

type NumberOperator = {
  type: ExprType.NumberOperator;
  operator: NumberOperatorOperator;
  left: Expr<typeof number>;
  right: Expr<typeof number>;
};

type NumberOperatorOperator = "+" | "-" | "*" | "/";

type StringLiteral = { type: ExprType.StringLiteral; value: string };

type StringConcatenate = {
  type: ExprType.StringConcatenate;
  left: Expr<typeof string>;
  right: Expr<typeof string>;
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

type ObjectLiteral<T extends { [name in string]: TypeExpr }> = {
  type: ExprType.ObjectLiteral;
  values: { [key in keyof T]: Expr<T[key]> };
};

type Lambda<
  parameterList extends ReadonlyArray<{
    name: string;
    typeExpr: TypeExpr;
    document: string;
  }>,
  returnType extends TypeExpr
> = {
  type: ExprType.Lambda;
  parameter: keyof parameterList["values"];
  expr: Expr<returnType>;
};

type GlobalVariable<type extends TypeExpr> = {
  type: ExprType.GlobalVariable;
  name: string;
  _type: type;
};

type ImportedVariable<type extends TypeExpr> = {
  type: ExprType.ImportedVariable;
  importId: ImportId;
  name: string;
  _type: type;
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

const globalModuleDefinitionToModule = <
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

export const addGlobal = <
  globalModuleDefinition extends ModuleOrGlobalDefinition
>(
  global: globalModuleDefinition,
  body: (global: Global<globalModuleDefinition>) => NodeJsCodeWithId
): NodeJsCodeWithId => {
  return body(globalModuleDefinitionToModule(global));
};

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
 * Node.js向けの外部のライブラリを読み込むimport文
 * @param path パス
 * @param id 識別するためのID
 */
export const importNodeModule = <
  moduleDefinition extends ModuleOrGlobalDefinition
>(
  path: string,
  moduleDefinition: moduleDefinition,
  rootIdentiferIndex: number,
  body: (module: Module<moduleDefinition>) => NodeJsCodeWithId
): { code: NodeJsCodeWithId; identiferIndex: number } => {
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

export const numberLiteral = (value: string): NumberLiteral => ({
  type: ExprType.NumberLiteral,
  value: value
});

/**
 * 数値の足し算 ??? + ???
 * @param left 左辺
 * @param right 右辺
 */
export const add = (
  left: Expr<typeof number>,
  right: Expr<typeof number>
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
  left: Expr<typeof number>,
  right: Expr<typeof number>
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
  left: Expr<typeof number>,
  right: Expr<typeof number>
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
  left: Expr<typeof number>,
  right: Expr<typeof number>
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

const primitiveTypeToString = (primitiveType: PrimitiveType): string => {
  switch (primitiveType) {
    case PrimitiveType.String:
      return "string";
    case PrimitiveType.Number:
      return "number";
    case PrimitiveType.Boolean:
      return "boolean";
    case PrimitiveType.Null:
      return "null";
    case PrimitiveType.Undefined:
      return "undefined";
  }
};

/** 関数の引数と戻り値の型を文字列にする */
const parameterAndReturnToString = (
  parameterList: ReadonlyArray<Parameter>,
  returnType: TypeExpr
): string =>
  "(" +
  parameterList
    .map(parameter => typeExprToString(parameter.typeExpr))
    .join(",") +
  ")=>" +
  typeExprToString(returnType);

/** 関数の型を文字列にする */
const functionTypeExprToString = (functionType: FunctionType): string => {
  switch (functionType.type) {
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
      return primitiveTypeToString(typeExpr.primitive);
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
      return functionTypeExprToString(typeExpr.functionType);
    case TypeExprType.Union:
      return typeExpr.types.map(typeExprToString).join("|");
    case TypeExprType.ImportedType:
      return (typeExpr.id as string) + "." + typeExpr.name;
    case TypeExprType.GlobalType:
      return typeExpr.name;
  }
};

// const exprToString = (expr: Expr<unknown>): string => {
//   switch (expr.type) {
//     case ExprType.NumberLiteral:
//       return expr.value;
//   }
// };

export const toNodeJsCodeAsTypeScript = (
  nodeJsCode: NodeJsCodeWithId
): string =>
  nodeJsCode.importNodeModuleList
    .map(
      (importNodeModule, index) =>
        "import * as " +
        createIdentifer(index) +
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
  ";";

/**
 * 作りたいコード
 *
 * import * as api from "./api";
 *
 * const leb128toNumber = (number):number => {
 *
 * }
 *
 * export const middleware = (request, response) => {
 *   if(request.accept==="text/html") {
 *      response.setHeader("", "");
 *      response.send("")
 *   }
 *   const a = request.body;
 *   if(a[0] === 0 ){
 *      response.send(api.getUser(a[32]))
 *   }
 *   response.send()
 * }
 *
 */

const innerCode = importNodeModule(
  "lib",
  {
    typeList: {
      libType: string
    },
    variableList: {
      libVar: string
    }
  },
  0,
  (libImportDefinition): NodeJsCodeWithId => ({})
);

const func = importNodeModule(
  "core",
  {
    typeList: {
      stringAlias: string
    },
    variableList: {
      coreSampleVar: string
    }
  },
  innerCode.identiferIndex,
  coreImportDefinition => innerCode.code
);
