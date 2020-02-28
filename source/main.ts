import * as collect from "./collect";
import * as type from "./type";
import * as identifer from "./identifer";
import * as namedExpr from "./toString";

export { collect };
export { type };
export { identifer };

/* ======================================================================================
 *                                      Module
 * ====================================================================================== */

const createImportedModuleName = (
  usedNameAndModulePath: type.UsedNameAndModulePath,
  identiferIndex: identifer.IdentiferIndex
): {
  importedModuleNameMap: type.ImportedModuleNameIdentiferMap;
  nextIdentiferIndex: identifer.IdentiferIndex;
} => {
  const importedModuleNameMap = new Map<string, string>();
  for (const modulePath of usedNameAndModulePath.modulePathList) {
    const identiferAndNextIdentiferIndex = identifer.createIdentifer(
      identiferIndex,
      usedNameAndModulePath.usedNameSet
    );
    importedModuleNameMap.set(
      modulePath,
      identiferAndNextIdentiferIndex.identifer
    );
    identiferIndex = identiferAndNextIdentiferIndex.nextIdentiferIndex;
  }
  return {
    importedModuleNameMap,
    nextIdentiferIndex: identiferIndex
  };
};

export const toNodeJsOrBrowserCodeAsTypeScript = (code: type.Code): string => {
  // グローバル空間にある名前とimportしたモジュールのパスを集める
  const usedNameAndModulePath: type.UsedNameAndModulePath = collect.collectCode(
    code
  );
  // インポートしたモジュールの名前空間識別子を当てはめる
  const { importedModuleNameMap } = createImportedModuleName(
    usedNameAndModulePath,
    identifer.initialIdentiferIndex
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
          collect.toNamedStatementList(
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

export const toESModulesBrowserCode = (code: type.Code): string => {
  // グローバル空間にある名前とimportしたESモジュールのURLを集める
  const {
    usedNameSet: globalNameSet,
    modulePathList: importedModulePath
  } = collect.collectCode(code);

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
          collect.toNamedStatementList(
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
