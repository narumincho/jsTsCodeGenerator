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

/**
 * グローバル空間とルートにある関数名の引数名、使っている外部モジュールのパスを集める
 */
const scanCode = (code: type.Code): type.GlobalNameData => {
  const scanData: type.GlobalNameData = type.init;
  for (const definition of code.exportDefinition) {
    scanDefinition(definition, scanData);
  }
  return scanData;
};

const scanDefinition = (
  definition: type.Definition,
  scanData: type.GlobalNameData
): void => {
  switch (definition._) {
    case type.Definition_.TypeAlias:
      identifer.checkIdentiferThrow(
        "export type name",
        definition.typeAlias.name
      );
      scanData.globalNameSet.add(definition.typeAlias.name);
      collect.scanType(definition.typeAlias.typeExpr, scanData);
      return;

    case type.Definition_.Enum:
      identifer.checkIdentiferThrow("export enum name", definition.enum_.name);
      for (const tagNameAndValue of definition.enum_.tagNameAndValueList) {
        identifer.checkIdentiferThrow(
          "enum member at " + definition.enum_.name,
          tagNameAndValue.name
        );
      }
      return;

    case type.Definition_.Function:
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
        collect.scanType(parameter.typeExpr, scanData);
      }
      collect.scanType(definition.function_.returnType, scanData);
      collect.scanStatementList(definition.function_.statementList, scanData);
      return;

    case type.Definition_.Variable:
      identifer.checkIdentiferThrow(
        "export variable name",
        definition.variable.name
      );
      scanData.globalNameSet.add(definition.variable.name);
      collect.scanType(definition.variable.typeExpr, scanData);
      collect.scanExpr(definition.variable.expr, scanData);
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

export const toNodeJsOrBrowserCodeAsTypeScript = (code: type.Code): string => {
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
