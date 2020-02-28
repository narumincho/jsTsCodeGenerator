import * as collect from "./collect";
import * as type from "./type";
import * as identifer from "./identifer";
import * as toString from "./toString";

export { collect };
export { type };
export { identifer };

export const generateCodeAsString = (
  code: type.Code,
  codeType: toString.CodeType
): string => {
  // グローバル空間にある名前とimportしたモジュールのパスを集める
  const usedNameAndModulePath: type.UsedNameAndModulePath = collect.collectCode(
    code
  );
  // インポートしたモジュールの名前空間識別子を当てはめる
  const { importedModuleNameMap } = createImportedModuleName(
    usedNameAndModulePath,
    identifer.initialIdentiferIndex
  );

  return toString.toString(
    code,
    {
      importedModuleNameIdentiferMap: importedModuleNameMap,
      enumTagListMap: usedNameAndModulePath.enumTagListMap
    },
    codeType
  );
};

const createImportedModuleName = (
  usedNameAndModulePath: type.UsedNameAndModulePath,
  identiferIndex: identifer.IdentiferIndex
): {
  importedModuleNameMap: Map<string, identifer.Identifer>;
  nextIdentiferIndex: identifer.IdentiferIndex;
} => {
  const importedModuleNameMap = new Map<string, identifer.Identifer>();
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
