const enum CheckIdentiferResult {
  IsEmpty,
  FirstCharInvalid,
  CharInvalid,
  Reserved
}

/**
 * 識別子として使える文字かどうか調べ、使えなかったら例外を発生させる。日本語の識別子は使えないものとする
 * @param nameInEnglish 調べている場所 エラーメッセージのためのヒント 英語
 * @param nameInJapanese 調べている場所 エラーメッセージのためのヒント 日本語
 * @param word 識別子として使えるかどうか調べるワード
 * @throws 予約語だった場合
 */
export const checkIdentiferThrow = (
  nameInEnglish: string,
  nameInJapanese: string,
  word: string
): void => {
  const result = checkIdentifer(word);
  if (result === null) {
    return;
  }
  switch (result) {
    case CheckIdentiferResult.IsEmpty:
      throw new Error(`${nameInEnglish} is empty.
${nameInJapanese}が空文字列で指定されています
`);
    case CheckIdentiferResult.FirstCharInvalid:
      throw new Error(`${nameInEnglish} is use invalid char in first. word = ${word}
${nameInJapanese}の先頭に識別子で使えない文字が使われています ワード = ${word}
`);
    case CheckIdentiferResult.CharInvalid:
      throw new Error(`${nameInEnglish} is use invalid char. word = ${word}
${nameInJapanese}に識別子で使えない文字が含まれています ワード = ${word}
`);
    case CheckIdentiferResult.Reserved:
      throw new Error(
        `${nameInEnglish} is revered or names that cannot be used in context. word = ${word}
    ${nameInJapanese}が予約語か文脈によって使えない名前になっています ワード = ${word}`
      );
  }
};

/**
 *識別子として使える文字かどうか調べる。日本語の識別子は使えないものとする
 * @param word 識別子として使えるかどうか調べるワード
 */
export const isIdentifer = (word: string): boolean =>
  checkIdentifer(word) === null;

export const checkIdentifer = (word: string): CheckIdentiferResult | null => {
  if (word.length <= 0) {
    return CheckIdentiferResult.IsEmpty;
  }
  if (
    !"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_".includes(word[0])
  ) {
    return CheckIdentiferResult.FirstCharInvalid;
  }
  for (let i = 1; i < word.length; i++) {
    if (
      !"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_0123456789".includes(
        word[i]
      )
    ) {
      return CheckIdentiferResult.CharInvalid;
    }
  }
  if (reservedByLanguageWordSet.has(word)) {
    return CheckIdentiferResult.Reserved;
  }
  return null;
};
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
  "window"
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
): { identifer: string; nextIdentiferIndex: IdentiferIndex } => {
  while (true) {
    const result = createIdentiferByIndex(identiferIndex);
    if (reserved.has(result) || reservedByLanguageWordSet.has(result)) {
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
