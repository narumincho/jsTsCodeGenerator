import * as indexedTypeExpr from "./indexedTree/typeExpr";
import * as indexedExpr from "./indexedTree/expr";
import * as type from "./type";
import * as identifer from "./identifer";
import * as namedExpr from "./namedTree/expr";
import * as namedTypeExpr from "./namedTree/typeExpr";

export { indexedTypeExpr as typeExpr };
export { indexedExpr as expr };
export { type };

/**
 * TypeScriptやJavaScriptのコードを表現する。
 * TypeScriptでも出力できるように型情報をつける必要がある
 */
export type Code = {
  /**
   * 外部に公開する型定義
   */
  readonly exportTypeAliasList: ReadonlyArray<ExportTypeAlias>;
  /**
   * 外部に公開する列挙型
   */
  readonly exportConstEnumMap: type.ExportConstEnumMap;
  /**
   * 外部に公開する関数
   */
  readonly exportFunctionList: ReadonlyArray<ExportFunction>;
  /**
   * 公開する関数を定義した後に実行するコード
   */
  readonly statementList: ReadonlyArray<indexedExpr.Statement>;
};

export type ExportTypeAlias = {
  readonly name: string;
  readonly document: string;
  readonly typeExpr: indexedTypeExpr.TypeExpr;
};

/**
 * 外部に公開する型定義
 * @param name 型定義名
 * @param document ドキュメント
 * @param typeExpr 式
 * @throws 使えない名前だった
 */
export const exportTypeAlias = (data: ExportTypeAlias): ExportTypeAlias => {
  identifer.checkIdentiferThrow(
    "export type alias name",
    "外部に公開する型定義の名前",
    data.name
  );
  return data;
};

export const exportConstEnum = ([name, tagNameAndValueList]: [
  string,
  type.ExportConstEnum
]): [string, type.ExportConstEnum] => {
  identifer.checkIdentiferThrow(
    "export const enum name",
    "外部に公開する列挙型の名前",
    name
  );
  for (const tagName of tagNameAndValueList.keys()) {
    identifer.checkIdentiferThrow(
      "const enum member",
      "列挙型のパターン",
      tagName
    );
  }
  return [name, tagNameAndValueList];
};

export type ExportFunction = {
  readonly name: string;
  readonly document: string;
  readonly parameterList: ReadonlyArray<{
    readonly name: string;
    readonly document: string;
    readonly typeExpr: indexedTypeExpr.TypeExpr;
  }>;
  readonly returnType: indexedTypeExpr.TypeExpr | null;
  readonly statementList: ReadonlyArray<indexedExpr.Statement>;
};

/**
 * 外部に公開する関数
 * @throws 使えない名前が含まれている
 */
export const exportFunction = (data: ExportFunction): ExportFunction => {
  identifer.checkIdentiferThrow(
    "export function parameter name",
    "外部に公開する変数名",
    data.name
  );
  for (const parameter of data.parameterList) {
    identifer.checkIdentiferThrow(
      "export function parameter name",
      "外部に公開する関数の引数名",
      parameter.name
    );
  }
  return data;
};
/* ======================================================================================
 *                                      Module
 * ====================================================================================== */

/**
 * グローバル空間とルートにある関数名の引数名、使っている外部モジュールのパスを集める
 */
const scanCode = (code: Code): type.ScanData => {
  const scanData: type.ScanData = type.init;
  for (const exportTypeAlias of code.exportTypeAliasList) {
    identifer.checkIdentiferThrow(
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
  for (const [name, tagNameAndValueList] of code.exportConstEnumMap) {
    identifer.checkIdentiferThrow(
      "export const enum name",
      "外部に公開する列挙型の名前",
      name
    );
    for (const tagName of tagNameAndValueList.keys()) {
      identifer.checkIdentiferThrow(
        "const enum member",
        "列挙型のパターン",
        tagName
      );
    }
  }
  for (const exportVariable of code.exportFunctionList) {
    identifer.checkIdentiferThrow(
      "export variable name",
      "外部に公開する変数名",
      exportVariable.name
    );
    scanData.globalNameSet.add(exportVariable.name);
    for (const parameter of exportVariable.parameterList) {
      identifer.checkIdentiferThrow(
        "export function parameter name",
        "外部に公開する関数の引数名",
        parameter.name
      );
      scanData.globalNameSet.add(parameter.name);
      indexedTypeExpr.scanGlobalVariableNameAndImportedPath(
        parameter.typeExpr,
        scanData
      );
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
  indexedExpr.scanGlobalVariableNameAndImportedPathInStatementList(
    code.statementList,
    scanData
  );
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

/** 外部に公開する型定義に名前をつける */
const toNamedExportTypeAliasList = (
  exportTypeAliasList: ReadonlyArray<ExportTypeAlias>,
  globalNameSet: ReadonlySet<string>,
  importedModuleNameIdentiferMap: ReadonlyMap<string, string>
): ReadonlyArray<{
  readonly name: string;
  readonly document: string;
  readonly typeExpr: namedTypeExpr.TypeExpr;
}> => {
  const namedList: Array<{
    readonly name: string;
    readonly document: string;
    readonly typeExpr: namedTypeExpr.TypeExpr;
  }> = [];
  for (const exportTypeAlias of exportTypeAliasList) {
    namedList.push({
      name: exportTypeAlias.name,
      document: exportTypeAlias.document,
      typeExpr: indexedTypeExpr.toNamed(
        exportTypeAlias.typeExpr,
        globalNameSet,
        importedModuleNameIdentiferMap
      )
    });
  }
  return namedList;
};

/**
 * 外部に公開する関数に名前をつける
 */
const toNamedExportFunctionList = (
  exportFunctionList: ReadonlyArray<ExportFunction>,
  globalNameSet: ReadonlySet<string>,
  importedModuleNameIdentiferMap: ReadonlyMap<string, string>,
  identiferIndexOnCreatedImportIdentifer: identifer.IdentiferIndex,
  exposedConstEnumType: type.ExportConstEnumMap
): ReadonlyArray<NamedExportFunction> => {
  const namedList: Array<NamedExportFunction> = [];

  // 外部に公開する関数を名前付けした構造にする
  for (const exportFunction of exportFunctionList) {
    namedList.push({
      name: exportFunction.name,
      document: exportFunction.document,
      parameterList: exportFunction.parameterList.map(parameter => ({
        name: parameter.name,
        document: parameter.document,
        typeExpr: indexedTypeExpr.toNamed(
          parameter.typeExpr,
          globalNameSet,
          importedModuleNameIdentiferMap
        )
      })),
      returnType:
        exportFunction.returnType === null
          ? null
          : indexedTypeExpr.toNamed(
              exportFunction.returnType,
              globalNameSet,
              importedModuleNameIdentiferMap
            ),
      statementList: indexedExpr.toNamedStatementList(
        exportFunction.statementList,
        globalNameSet,
        importedModuleNameIdentiferMap,
        identiferIndexOnCreatedImportIdentifer,
        [],
        exportFunction.parameterList.map(parameter => parameter.name),
        exposedConstEnumType
      )
    });
  }
  return namedList;
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

  const namedExportTypeAliasList = toNamedExportTypeAliasList(
    code.exportTypeAliasList,
    globalNameSet,
    importedModuleNameMap
  );

  const namedExportFunctionList = toNamedExportFunctionList(
    code.exportFunctionList,
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
            ([path, identifer]) =>
              "import * as " + identifer + ' from "' + path + '"'
          )
          .join(";\n") + ";\n") +
    namedExportTypeAliasList
      .map(
        exportTypeAlias =>
          "/**\n * " +
          exportTypeAlias.document.split("\n").join("\n * ") +
          "\n */\nexport type " +
          exportTypeAlias.name +
          " = " +
          namedTypeExpr.typeExprToString(exportTypeAlias.typeExpr)
      )
      .join(";\n") +
    "\n" +
    [...code.exportConstEnumMap]
      .map(
        ([name, tagNameAndValueList]) =>
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
    namedExportFunctionList
      .map(
        (exportFunction): string =>
          "/**\n * " +
          exportFunction.document.split("\n").join("\n * ") +
          "\n" +
          exportFunction.parameterList
            .map(p => " * @param " + p.name + " " + p.document)
            .join("\n") +
          "\n */\nexport const " +
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
          " => " +
          namedExpr.lambdaBodyToString(
            exportFunction.statementList,
            0,
            namedExpr.CodeType.TypeScript
          )
      )
      .join("\n\n") +
    "\n" +
    (code.statementList.length === 0
      ? ""
      : namedExpr.statementListToString(
          indexedExpr.toNamedStatementList(
            code.statementList,
            globalNameSet,
            importedModuleNameMap,
            nextIdentiferIndex,
            [
              {
                variable: code.exportFunctionList.map(func => func.name),
                argument: []
              }
            ],
            [],
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

  const namedExportFunctionList = toNamedExportFunctionList(
    code.exportFunctionList,
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
    namedExportFunctionList
      .map(
        (exportFunction): string =>
          "export const " +
          exportFunction.name +
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
      .join("\n\n") +
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
            [],
            code.exportConstEnumMap
          ),
          0,
          namedExpr.CodeType.JavaScript
        ))
  );
};
