/**
 * 予約語が使われているか調べる
 * @param nameInEnglish 調べている場所 エラーメッセージのためのヒント 英語
 * @param nameInJapanese 調べている場所 エラーメッセージのためのヒント 日本語
 * @param reservedWord 予約語かどうか調べるワード
 * @throws Error
 */
export const checkUsingReservedWord = (
  nameInEnglish: string,
  nameInJapanese: string,
  word: string
): void => {
  if (reservedWordSet.has(word)) {
    throw new Error(
      `${nameInEnglish} is revered or names that cannot be used in context. word = ${word}
  ${nameInJapanese}が予約語か文脈によって使えない名前になっています ワード = ${word}`
    );
  }
};

export const reservedWordSet = new Set([
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
  "window"
]);

/**
 * 識別子のID
 */
type IdentiferIndex = number & { _identiferIndex: never };

export const initialIdentiferIndex = 0;

/**
 * 識別子を生成する
 */
export const createIdentifer = (
  identiferIndex: IdentiferIndex,
  reserved: Set<string>
): { identifer: string; nextIdentiferIndex: IdentiferIndex } => {
  while (true) {
    const result = createIdentiferByIndex(identiferIndex);
    if (reserved.has(result)) {
      (identiferIndex as number) += 1;
      continue;
    }
    return {
      identifer: result,
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
