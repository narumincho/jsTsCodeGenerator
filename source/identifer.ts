export type Identifer = string & { _identifer: never };

/**
 * 識別子を文字列から無理矢理でも生成する.
 * 空文字だった場合は $
 * 識別子に使えない文字が含まれていた場合, 末尾に_がつくか, $マークでエンコードされる
 * @param text
 */
export const fromString = (word: string): Identifer => {
  if (word.length <= 0) {
    return "$00" as Identifer;
  }
  let result = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_".includes(
    word[0]
  )
    ? word[0]
    : escapeChar(word[0]);

  for (let i = 1; i < word.length; i++) {
    result =
      result +
      ("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_0123456789".includes(
        word[i]
      )
        ? word[i]
        : escapeChar(word[i]));
  }
  if (reservedByLanguageWordSet.has(word)) {
    return (result + "_") as Identifer;
  }
  return result as Identifer;
};

const escapeChar = (char: string): string => char.charCodeAt(0).toString(16);

/**
 * JavaScriptやTypeScriptによって決められた予約語と、できるだけ使いたくない語
 */
const reservedByLanguageWordSet: ReadonlySet<string> = new Set([
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "new",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
  "let",
  "static",
  "enum",
  "implements",
  "package",
  "protected",
  "interface",
  "private",
  "public",
  "null",
  "true",
  "false",
  "any",
  "boolean",
  "constructor",
  "declare",
  "get",
  "module",
  "require",
  "number",
  "set",
  "string",
  "symbol",
  "type",
  "from",
  "of",
  "as",
  "unknown",
  "Infinity",
  "NaN",
  "undefined",
  "top",
  "closed",
  "self",
  "window",
  "Object",
  "Error",
  "Number",
  "Math",
  "Date",
  "Uint8Array",
  "Map",
  "Set",
  "console"
]);

/**
 * 識別子のID
 */
export type IdentiferIndex = number & { _identiferIndex: never };

/** 初期インデックス */
export const initialIdentiferIndex = 0 as IdentiferIndex;

/**
 * 識別子を生成する
 * @param identiferIndex 識別子を生成するインデックス
 * @param reserved 言語の予約語と別に
 */
export const createIdentifer = (
  identiferIndex: IdentiferIndex,
  reserved: ReadonlySet<string>
): { identifer: Identifer; nextIdentiferIndex: IdentiferIndex } => {
  while (true) {
    const result = createIdentiferByIndex(identiferIndex);
    if (reserved.has(result) || reservedByLanguageWordSet.has(result)) {
      (identiferIndex as number) += 1;
      continue;
    }
    return {
      identifer: result as Identifer,
      nextIdentiferIndex: ((identiferIndex as number) + 1) as IdentiferIndex
    };
  }
};

/**
 * indexから識別子を生成する (予約語を考慮しない)
 * @param index
 */
const createIdentiferByIndex = (index: number): string => {
  const headIdentiferCharTable =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const noHeadIdentiferCharTable = headIdentiferCharTable + "0123456789";
  if (index < headIdentiferCharTable.length) {
    return headIdentiferCharTable[index];
  }
  let result = "";
  index -= headIdentiferCharTable.length;
  while (true) {
    const quotient = Math.floor(index / noHeadIdentiferCharTable.length);
    const remainder = index % noHeadIdentiferCharTable.length;
    if (quotient < headIdentiferCharTable.length) {
      return (
        headIdentiferCharTable[quotient] +
        noHeadIdentiferCharTable[remainder] +
        result
      );
    }
    result = noHeadIdentiferCharTable[remainder] + result;
    index = quotient;
  }
};

/**
 *識別子として使える文字かどうか調べる。日本語の識別子は使えないものとする
 * @param word 識別子として使えるかどうか調べるワード
 */
export const isIdentifer = (word: string): boolean => {
  if (word.length <= 0) {
    return false;
  }
  if (
    !"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_".includes(word[0])
  ) {
    return false;
  }
  for (let i = 1; i < word.length; i++) {
    if (
      !"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_0123456789".includes(
        word[i]
      )
    ) {
      return false;
    }
  }
  return !reservedByLanguageWordSet.has(word);
};
