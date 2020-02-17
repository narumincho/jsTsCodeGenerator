export type ScanData = {
  globalNameSet: Set<string>;
  importedModulePath: Set<string>;
};

export const init: ScanData = {
  globalNameSet: new Set(),
  importedModulePath: new Set()
};

export type ExportConstEnumMap = ReadonlyMap<string, ExportConstEnum>;

export type ExportConstEnum = ReadonlyMap<string, number>;
