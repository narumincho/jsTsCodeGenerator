import * as indexedTypeExpr from "./indexedTree/typeExpr";
import * as indexedExpr from "./indexedTree/expr";
import * as scanType from "./scanType";
import * as identifer from "./identifer";
import * as namedExpr from "./namedTree/expr";
import * as namedTypeExpr from "./namedTree/typeExpr";

export { indexedTypeExpr };
export { indexedExpr };

/**
 * Node.js向けのコード。TypeScriptでも出力できるように型情報をつける必要がある
 */
export type NodeJsCode = {
  exportTypeAliasList: ReadonlyArray<ExportTypeAlias>;
  exportFunctionList: ReadonlyArray<ExportFunction>;
};

type ExportTypeAlias = {
  readonly name: string;
  readonly document: string;
  readonly typeExpr: indexedTypeExpr.TypeExpr;
};

type ExportFunction = {
  readonly name: string;
  readonly document: string;
  readonly parameterList: ReadonlyArray<{
    name: string;
    document: string;
    typeExpr: indexedTypeExpr.TypeExpr;
  }>;
  readonly returnType: indexedTypeExpr.TypeExpr | null;
  readonly statementList: ReadonlyArray<indexedExpr.Statement>;
};

/* ======================================================================================
 *                                      Module
 * ====================================================================================== */
type ValueOf<T> = T[keyof T];

/**
 * Node.js向けの外部のライブラリをimportして使えるようにする
 */
export const createImportNodeModule = <
  typeList extends Array<string>,
  variableList extends Array<string>
>(
  path: string,
  typeList: typeList,
  variableList: variableList
): {
  typeList: { [name in ValueOf<typeList> & string]: indexedTypeExpr.TypeExpr };
  variableList: { [name in ValueOf<variableList> & string]: indexedExpr.Expr };
} => {
  const typeListObject = {} as {
    [name in ValueOf<typeList> & string]: indexedTypeExpr.TypeExpr;
  };
  const variableListObject = {} as {
    [name in ValueOf<variableList> & string]: indexedExpr.Expr;
  };
  for (const typeName of typeList) {
    typeListObject[
      typeName as ValueOf<typeList> & string
    ] = indexedTypeExpr.importedType(path, typeName);
  }
  for (const variableName of variableList) {
    variableListObject[
      variableName as ValueOf<variableList> & string
    ] = indexedExpr.importedVariable(path, variableName);
  }
  return {
    typeList: typeListObject,
    variableList: variableListObject
  };
};

/**
 * グローバル空間の型と変数の型情報を渡して使えるようにする
 * @param global グローバル空間の型と変数の型情報
 * @param body コード本体
 */
export const createGlobalNamespace = <
  typeList extends Array<string>,
  variableList extends Array<string>
>(
  typeList: typeList,
  variableList: variableList
): {
  typeList: { [name in ValueOf<typeList> & string]: indexedTypeExpr.TypeExpr };
  variableList: { [name in ValueOf<variableList> & string]: indexedExpr.Expr };
} => {
  const typeListObject = {} as {
    [name in ValueOf<typeList> & string]: indexedTypeExpr.TypeExpr;
  };
  const variableListObject = {} as {
    [name in ValueOf<variableList> & string]: indexedExpr.Expr;
  };
  for (const typeName of typeList) {
    typeListObject[
      typeName as ValueOf<typeList> & string
    ] = indexedTypeExpr.globalType(typeName);
  }
  for (const variableName of variableList) {
    variableListObject[
      variableName as ValueOf<variableList> & string
    ] = indexedExpr.globalVariable(variableName);
  }
  return {
    typeList: typeListObject,
    variableList: variableListObject
  };
};

/**
 * グローバル空間とルートにある関数名の引数名、使っている外部モジュールのパスを集める
 */
const scanNodeJsCode = (
  nodeJsCode: NodeJsCode
): scanType.NodeJsCodeScanData => {
  const scanData: scanType.NodeJsCodeScanData = {
    globalNameSet: new Set(),
    importedModulePath: new Set()
  };
  for (const exportTypeAlias of nodeJsCode.exportTypeAliasList) {
    identifer.checkUsingReservedWord(
      "export type name",
      "外部に公開する型の名前",
      exportTypeAlias.name
    );
    scanData.globalNameSet.add(exportTypeAlias.name);
    indexedTypeExpr.scanGlobalVariableNameAndImportedPath(
      exportTypeAlias.typeExpr,
      scanData
    );
  }
  for (const exportVariable of nodeJsCode.exportFunctionList) {
    identifer.checkUsingReservedWord(
      "export variable name",
      "外部に公開する変数名",
      exportVariable.name
    );
    scanData.globalNameSet.add(exportVariable.name);
    for (const parameter of exportVariable.parameterList) {
      identifer.checkUsingReservedWord(
        "export function parameter name",
        "外部に公開する関数の引数名",
        parameter.name
      );
      scanData.globalNameSet.add(parameter.name);
    }

    if (exportVariable.returnType !== null) {
      indexedTypeExpr.scanGlobalVariableNameAndImportedPath(
        exportVariable.returnType,
        scanData
      );
    }
    indexedExpr.scanGlobalVariableNameAndImportedPathInStatementList(
      exportVariable.statementList,
      scanData
    );
  }
  return scanData;
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
  readonly name: string;
  readonly document: string;
  readonly parameterList: ReadonlyArray<{
    readonly name: string;
    readonly document: string;
    readonly typeExpr: namedTypeExpr.TypeExpr;
  }>;
  readonly returnType: namedTypeExpr.TypeExpr | null;
  readonly statementList: ReadonlyArray<namedExpr.Statement>;
};

export const toNodeJsCodeAsTypeScript = (nodeJsCode: NodeJsCode): string => {
  // グローバル空間にある名前とimportしたモジュールのパスを集める
  const scanData = scanNodeJsCode(nodeJsCode);

  // インポートしたモジュールの名前空間識別子を当てはめる
  const importedModuleNameMapAndNextIdentiferIndex = createImportedModuleName(
    scanData.importedModulePath,
    identifer.initialIdentiferIndex,
    scanData.globalNameSet
  );
  const importedModuleNameMap =
    importedModuleNameMapAndNextIdentiferIndex.importedModuleNameMap;

  const globalNameSet = new Set([
    ...scanData.globalNameSet,
    ...importedModuleNameMap.values()
  ]);

  const namedExportTypeAliasList: Array<{
    readonly name: string;
    readonly document: string;
    readonly typeExpr: namedTypeExpr.TypeExpr;
  }> = [];
  for (const exportTypeAlias of nodeJsCode.exportTypeAliasList) {
    namedExportTypeAliasList.push({
      name: exportTypeAlias.name,
      document: exportTypeAlias.document,
      typeExpr: indexedTypeExpr.toNamed(
        exportTypeAlias.typeExpr,
        globalNameSet,
        importedModuleNameMap
      )
    });
  }

  const namedExportFunctionList: Array<NamedExportFunction> = [];

  // 外部に公開する関数を名前付けした構造にする
  for (const exportFunction of nodeJsCode.exportFunctionList) {
    namedExportFunctionList.push({
      name: exportFunction.name,
      document: exportFunction.document,
      parameterList: exportFunction.parameterList.map(parameter => ({
        name: parameter.name,
        document: parameter.document,
        typeExpr: indexedTypeExpr.toNamed(
          parameter.typeExpr,
          globalNameSet,
          importedModuleNameMapAndNextIdentiferIndex.importedModuleNameMap
        )
      })),
      returnType:
        exportFunction.returnType === null
          ? null
          : indexedTypeExpr.toNamed(
              exportFunction.returnType,
              globalNameSet,
              importedModuleNameMap
            ),
      statementList: indexedExpr.toNamedStatementList(
        exportFunction.statementList,
        importedModuleNameMapAndNextIdentiferIndex.importedModuleNameMap,
        importedModuleNameMapAndNextIdentiferIndex.nextIdentiferIndex
      )
    });
  }

  return (
    [
      ...importedModuleNameMapAndNextIdentiferIndex.importedModuleNameMap.entries()
    ]
      .map(
        ([path, identifer]) =>
          "import * as " + identifer + ' from "' + path + '"'
      )
      .join(";\n") +
    ";\n" +
    namedExportTypeAliasList
      .map(
        exportTypeAlias =>
          "/** " +
          exportTypeAlias.document +
          " */export type " +
          exportTypeAlias.name +
          " = " +
          namedTypeExpr.typeExprToString(exportTypeAlias.typeExpr)
      )
      .join(";\n") +
    "\n" +
    namedExportFunctionList
      .map(
        (exportFunction): string =>
          "/** \n * " +
          exportFunction.document.split("\n").join("\n * ") +
          "\n" +
          exportFunction.parameterList
            .map(p => " * @param " + p.name + " " + p.document)
            .join("\n") +
          "\n" +
          " */\nexport const " +
          exportFunction.name +
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
          " => {" +
          exportFunction.statementList
            .map(statement => namedExpr.statementToString(statement))
            .join(";") +
          "}"
      )
      .join(";\n")
  );
};
