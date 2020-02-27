import * as indexedTypeExpr from "./indexedTree/typeExpr";
import * as indexedExpr from "./indexedTree/expr";
import * as type from "./type";
import * as identifer from "./identifer";
import * as namedExpr from "./namedTree/expr";
import * as namedTypeExpr from "./namedTree/typeExpr";
import * as builtIn from "./builtIn";

export { indexedTypeExpr as typeExpr };
export { indexedExpr as expr };
export { type };
export { identifer };
export { builtIn };

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
  readonly statementList: ReadonlyArray<indexedExpr.Statement>;
};

type Definition =
  | { _: Definition_.TypeAlias; typeAlias: TypeAlias }
  | {
      _: Definition_.Enum;
      enum_: type.Enum;
    }
  | {
      _: Definition_.Function;
      function_: Function_;
    }
  | {
      _: Definition_.Variable;
      variable: Variable;
    };

const enum Definition_ {
  TypeAlias,
  Enum,
  Function,
  Variable
}

export type TypeAlias = {
  readonly name: string;
  readonly document: string;
  readonly typeExpr: indexedTypeExpr.TypeExpr;
};

export type Function_ = {
  readonly name: string;
  readonly document: string;
  readonly parameterList: ReadonlyArray<Parameter>;
  readonly returnType: indexedTypeExpr.TypeExpr;
  readonly statementList: ReadonlyArray<indexedExpr.Statement>;
};

export type Parameter = {
  readonly name: string;
  readonly document: string;
  readonly typeExpr: indexedTypeExpr.TypeExpr;
};

export type Variable = {
  readonly name: string;
  readonly document: string;
  readonly typeExpr: indexedTypeExpr.TypeExpr;
  readonly expr: indexedExpr.Expr;
};

export const definitionTypeAlias = (typeAlias: TypeAlias): Definition => ({
  _: Definition_.TypeAlias,
  typeAlias
});

export const definitionEnum = (enum_: type.Enum): Definition => ({
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

export type NamedTypeAlias = {
  readonly name: string;
  readonly document: string;
  readonly typeExpr: namedTypeExpr.TypeExpr;
};

export type NamedFunction_ = {
  readonly name: string;
  readonly document: string;
  readonly parameterList: ReadonlyArray<Parameter>;
  readonly returnType: namedTypeExpr.TypeExpr;
  readonly statementList: ReadonlyArray<namedExpr.Statement>;
};

export type NamedVariable = {
  readonly name: string;
  readonly document: string;
  readonly typeExpr: namedTypeExpr.TypeExpr;
  readonly expr: namedExpr.Expr;
};

/* ======================================================================================
 *                                      Module
 * ====================================================================================== */

/**
 * グローバル空間とルートにある関数名の引数名、使っている外部モジュールのパスを集める
 */
const scanCode = (code: Code): type.GlobalNameData => {
  const scanData: type.GlobalNameData = type.init;
  for (const definition of code.exportDefinition) {
    scanDefinition(definition, scanData);
  }
  return scanData;
};

const scanDefinition = (
  definition: Definition,
  scanData: type.GlobalNameData
): void => {
  switch (definition._) {
    case Definition_.TypeAlias:
      identifer.checkIdentiferThrow(
        "export type name",
        definition.typeAlias.name
      );
      scanData.globalNameSet.add(definition.typeAlias.name);
      indexedTypeExpr.scan(definition.typeAlias.typeExpr, scanData);
      return;

    case Definition_.Enum:
      identifer.checkIdentiferThrow("export enum name", definition.enum_.name);
      for (const tagNameAndValue of definition.enum_.tagNameAndValueList) {
        identifer.checkIdentiferThrow(
          "enum member at " + definition.enum_.name,
          tagNameAndValue.name
        );
      }
      return;

    case Definition_.Function:
      identifer.checkIdentiferThrow(
        "export function name",
        definition.function_.name
      );
      scanData.globalNameSet.add(definition.function_.name);
      for (const parameter of definition.function_.parameterList) {
        identifer.checkIdentiferThrow(
          "export function parameter name. functionName = " +
            definition.function_.name,
          parameter.name
        );
        scanData.globalNameSet.add(parameter.name);
        indexedTypeExpr.scan(parameter.typeExpr, scanData);
      }
      indexedTypeExpr.scan(definition.function_.returnType, scanData);
      indexedExpr.scanStatementList(
        definition.function_.statementList,
        scanData
      );
      return;

    case Definition_.Variable:
      identifer.checkIdentiferThrow(
        "export variable name",
        definition.variable.name
      );
      scanData.globalNameSet.add(definition.variable.name);
      indexedTypeExpr.scan(definition.variable.typeExpr, scanData);
      indexedExpr.scanExpr(definition.variable.expr, scanData);
      return;
  }
};

const createImportedModuleName = (
  importedModulePathSet: Set<string>,
  identiferIndex: identifer.IdentiferIndex,
  reserved: Set<string>
): {
  importedModuleNameMap: Map<string, string>;
  nextIdentiferIndex: identifer.IdentiferIndex;
} => {
  const importedModuleNameMap = new Map<string, string>();
  for (const importedModulePath of importedModulePathSet) {
    const identiferAndNextIdentiferIndex = identifer.createIdentifer(
      identiferIndex,
      reserved
    );
    importedModuleNameMap.set(
      importedModulePath,
      identiferAndNextIdentiferIndex.identifer
    );
    identiferIndex = identiferAndNextIdentiferIndex.nextIdentiferIndex;
  }
  return {
    importedModuleNameMap,
    nextIdentiferIndex: identiferIndex
  };
};

type NamedExportFunction = {
  readonly document: string;
  readonly parameterList: ReadonlyArray<{
    readonly name: string;
    readonly document: string;
    readonly typeExpr: namedTypeExpr.TypeExpr;
  }>;
  readonly returnType: namedTypeExpr.TypeExpr | null;
  readonly statementList: ReadonlyArray<namedExpr.Statement>;
};

/** 外部に公開する型定義に名前をつける */
const toNamedExportTypeAliasList = (
  typeAliasList: ReadonlyArray<TypeAlias>,
  globalNameAndImportPathAndIdentifer: type.GlobalNameAndImportPathAndIdentifer
): ReadonlyArray<NamedTypeAlias> => {
  const namedList: Array<NamedTypeAlias> = [];
  for (const typeAlias of typeAliasList) {
    namedList.push({
      name: typeAlias.name,
      document: typeAlias.document,
      typeExpr: indexedTypeExpr.toNamed(
        typeAlias.typeExpr,
        globalNameAndImportPathAndIdentifer
      )
    });
  }
  return namedList;
};

/**
 * 外部に公開する関数に名前をつける
 */
const toNamedExportFunctionList = (
  exportFunctionList: ReadonlyMap<string, Function_>,
  globalNameAndImportPathAndIdentifer: type.GlobalNameAndImportPathAndIdentifer,
  identiferIndexOnCreatedImportIdentifer: identifer.IdentiferIndex,
  exposedConstEnumType: ReadonlyArray<type.Enum>
): ReadonlyMap<string, NamedExportFunction> => {
  const namedMap: Map<string, NamedExportFunction> = new Map();

  // 外部に公開する関数を名前付けした構造にする
  for (const [name, exportFunction] of exportFunctionList) {
    namedMap.set(name, {
      document: exportFunction.document,
      parameterList: exportFunction.parameterList.map(parameter => ({
        name: parameter.name,
        document: parameter.document,
        typeExpr: indexedTypeExpr.toNamed(
          parameter.typeExpr,
          globalNameAndImportPathAndIdentifer
        )
      })),
      returnType:
        exportFunction.returnType === null
          ? null
          : indexedTypeExpr.toNamed(
              exportFunction.returnType,
              globalNameAndImportPathAndIdentifer
            ),
      statementList: indexedExpr.toNamedStatementList(
        exportFunction.statementList,
        globalNameAndImportPathAndIdentifer,
        identiferIndexOnCreatedImportIdentifer,
        [],
        new Map(
          exportFunction.parameterList.map(parameter => [
            parameter.name,
            parameter.name
          ])
        ),
        exposedConstEnumType
      )
    });
  }
  return namedMap;
};

export const toNodeJsOrBrowserCodeAsTypeScript = (code: Code): string => {
  // グローバル空間にある名前とimportしたモジュールのパスを集める
  const { globalNameSet, importedModulePath } = scanCode(code);
  // インポートしたモジュールの名前空間識別子を当てはめる
  const {
    importedModuleNameMap,
    nextIdentiferIndex
  } = createImportedModuleName(
    importedModulePath,
    identifer.initialIdentiferIndex,
    globalNameSet
  );
  const globalNameAndImportPathAndIdentifer: type.GlobalNameAndImportPathAndIdentifer = {
    globalNameSet: globalNameSet,
    importedModuleNameIdentiferMap: importedModuleNameMap
  };

  const namedExportTypeAliasMap = toNamedExportTypeAliasList(
    code.exportDefinition,
    globalNameAndImportPathAndIdentifer
  );

  const namedExportFunctionMap = toNamedExportFunctionList(
    code.exportFunctionMap,
    globalNameAndImportPathAndIdentifer,
    nextIdentiferIndex,
    code.exportConstEnumMap
  );

  return (
    (importedModuleNameMap.size === 0
      ? ""
      : [...importedModuleNameMap.entries()]
          .map(
            ([path, identifer]) =>
              "import * as " + identifer + ' from "' + path + '"'
          )
          .join(";\n") + ";\n") +
    [...namedExportTypeAliasMap]
      .map(
        ([name, exportTypeAlias]): string =>
          "/**\n * " +
          exportTypeAlias.document.split("\n").join("\n * ") +
          "\n */\nexport type " +
          name +
          " = " +
          namedTypeExpr.typeExprToString(exportTypeAlias.typeExpr)
      )
      .join(";\n") +
    "\n" +
    [...code.exportConstEnumMap]
      .map(
        ([name, tagNameAndValueList]): string =>
          "export const enum " +
          name +
          " {\n" +
          [...tagNameAndValueList]
            .map(
              ([tagName, value]) => "  " + tagName + " = " + value.toString()
            )
            .join(",\n") +
          "\n}"
      )
      .join("\n") +
    "\n" +
    [...namedExportFunctionMap]
      .map(
        ([name, exportFunction]): string =>
          "/**\n * " +
          exportFunction.document.split("\n").join("\n * ") +
          "\n" +
          exportFunction.parameterList
            .map(p => " * @param " + p.name + " " + p.document)
            .join("\n") +
          "\n */\nexport const " +
          name +
          " = (" +
          exportFunction.parameterList
            .map(
              parameter =>
                parameter.name +
                ": " +
                namedTypeExpr.typeExprToString(parameter.typeExpr)
            )
            .join(", ") +
          "): " +
          (exportFunction.returnType === null
            ? "void"
            : namedTypeExpr.typeExprToString(exportFunction.returnType)) +
          " => " +
          namedExpr.lambdaBodyToString(
            exportFunction.statementList,
            0,
            namedExpr.CodeType.TypeScript
          )
      )
      .join(";\n\n") +
    "\n" +
    (code.statementList.length === 0
      ? ""
      : namedExpr.statementListToString(
          indexedExpr.toNamedStatementList(
            code.statementList,
            globalNameSet,
            importedModuleNameMap,
            nextIdentiferIndex,
            [],
            new Map(),
            code.exportConstEnumMap
          ),
          0,
          namedExpr.CodeType.TypeScript
        ))
  );
};

export const toESModulesBrowserCode = (code: Code): string => {
  // グローバル空間にある名前とimportしたESモジュールのURLを集める
  const { globalNameSet, importedModulePath } = scanCode(code);

  // インポートしたモジュールの名前空間識別子を当てはめる
  const {
    importedModuleNameMap,
    nextIdentiferIndex
  } = createImportedModuleName(
    importedModulePath,
    identifer.initialIdentiferIndex,
    globalNameSet
  );

  const namedExportFunctionMap = toNamedExportFunctionList(
    code.exportFunctionMap,
    globalNameSet,
    importedModuleNameMap,
    nextIdentiferIndex,
    code.exportConstEnumMap
  );

  return (
    (importedModuleNameMap.size === 0
      ? ""
      : [...importedModuleNameMap.entries()]
          .map(
            ([url, identifer]) =>
              "import * as " + identifer + ' from "' + url + '"'
          )
          .join(";\n") + ";\n") +
    [...namedExportFunctionMap]
      .map(
        ([name, exportFunction]): string =>
          "export const " +
          name +
          "=(" +
          exportFunction.parameterList
            .map(parameter => parameter.name)
            .join(",") +
          ")=>" +
          namedExpr.lambdaBodyToString(
            exportFunction.statementList,
            0,
            namedExpr.CodeType.JavaScript
          )
      )
      .join(";\n\n") +
    "\n" +
    (code.statementList.length === 0
      ? ""
      : namedExpr.statementListToString(
          indexedExpr.toNamedStatementList(
            code.statementList,
            globalNameSet,
            importedModuleNameMap,
            nextIdentiferIndex,
            [],
            new Map(),
            code.exportConstEnumMap
          ),
          0,
          namedExpr.CodeType.JavaScript
        ))
  );
};
