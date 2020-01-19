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
  "unknown"
]);
