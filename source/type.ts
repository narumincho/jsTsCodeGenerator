export type ScanData = {
  globalNameSet: Set<string>;
  importedModulePath: Set<string>;
};

export const init: ScanData = {
  globalNameSet: new Set(),
  importedModulePath: new Set()
};

export type ExportConstEnumMap = ReadonlyMap<
  string,
  ExportConstEnumTagNameAndValueList
>;

export type ExportConstEnumTagNameAndValueList = ReadonlyMap<string, number>;
