export type GlobalNameData = {
  readonly globalNameSet: Set<string>;
  readonly importedModulePath: Set<string>;
};

export type GlobalNameAndImportPathAndIdentifer = {
  readonly globalNameSet: Set<string>;
  readonly importedModuleNameIdentiferMap: ReadonlyMap<string, string>;
};

export const init: GlobalNameData = {
  globalNameSet: new Set(),
  importedModulePath: new Set()
};

export type Enum = {
  readonly name: string;
  readonly document: string;
  readonly tagNameAndValueList: ReadonlyArray<TagNameAndValue>;
};

export type TagNameAndValue = {
  readonly name: string;
  readonly value: number;
};

export type UnaryOperator = "-" | "~" | "!";

export type BinaryOperator =
  | "**"
  | "*"
  | "/"
  | "%"
  | "+"
  | "-"
  | "<<"
  | ">>"
  | ">>>"
  | "<"
  | "<="
  | "==="
  | "!=="
  | "&"
  | "^"
  | "|"
  | "&&"
  | "||";
