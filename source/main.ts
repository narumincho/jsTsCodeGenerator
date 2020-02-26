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
   * 外部に公開する型定義
   */
  readonly exportTypeAliasMap: ReadonlyMap<string, ExportTypeAlias>;
  /**
   * 外部に公開する列挙型
   */
  readonly exportConstEnumMap: type.ExportConstEnumMap;
  /**
   * 外部に公開する関数
   */
  readonly exportFunctionMap: ReadonlyMap<string, ExportFunction>;
  /**
   * 公開する関数を定義した後に実行するコード
   */
  readonly statementList: ReadonlyArray<indexedExpr.Statement>;
};

export type ExportTypeAlias = {
  /** ドキュメント */
  readonly document: string;
  /** 式 */
  readonly typeExpr: indexedTypeExpr.TypeExpr;
};

export type ExportFunction = {
  readonly document: string;
  readonly parameterList: ReadonlyArray<{
    readonly name: string;
    readonly document: string;
    readonly typeExpr: indexedTypeExpr.TypeExpr;
  }>;
  readonly returnType: indexedTypeExpr.TypeExpr | null;
  readonly statementList: ReadonlyArray<indexedExpr.Statement>;
};

/* ======================================================================================
 *                                      Module
 * ====================================================================================== */

/**
 * グローバル空間とルートにある関数名の引数名、使っている外部モジュールのパスを集める
 */
const scanCode = (code: Code): type.ScanData => {
  const scanData: type.ScanData = type.init;
  for (const [name, exportTypeAlias] of code.exportTypeAliasMap) {
    identifer.checkIdentiferThrow(
      "export type name",
      "外部に公開する型の名前",
      name
    );
    scanData.globalNameSet.add(name);
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
  for (const [name, exportVariable] of code.exportFunctionMap) {
    identifer.checkIdentiferThrow(
      "export variable name",
      "外部に公開する変数名",
      name
    );
    scanData.globalNameSet.add(name);
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
  exportTypeAliasList: ReadonlyMap<string, ExportTypeAlias>,
  globalNameSet: ReadonlySet<string>,
  importedModuleNameIdentiferMap: ReadonlyMap<string, string>
): ReadonlyMap<
  string,
  {
    readonly document: string;
    readonly typeExpr: namedTypeExpr.TypeExpr;
  }
> => {
  const namedMap: Map<
    string,
    {
      readonly document: string;
      readonly typeExpr: namedTypeExpr.TypeExpr;
    }
  > = new Map();
  for (const [name, exportTypeAlias] of exportTypeAliasList) {
    namedMap.set(name, {
      document: exportTypeAlias.document,
      typeExpr: indexedTypeExpr.toNamed(
        exportTypeAlias.typeExpr,
        globalNameSet,
        importedModuleNameIdentiferMap
      )
    });
  }
  return namedMap;
};

/**
 * 外部に公開する関数に名前をつける
 */
const toNamedExportFunctionList = (
  exportFunctionList: ReadonlyMap<string, ExportFunction>,
  globalNameSet: ReadonlySet<string>,
  importedModuleNameIdentiferMap: ReadonlyMap<string, string>,
  identiferIndexOnCreatedImportIdentifer: identifer.IdentiferIndex,
  exposedConstEnumType: type.ExportConstEnumMap
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

  const namedExportTypeAliasMap = toNamedExportTypeAliasList(
    code.exportTypeAliasMap,
    globalNameSet,
    importedModuleNameMap
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
