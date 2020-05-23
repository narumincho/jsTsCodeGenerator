import * as identifer from "./identifer";
import * as data from "./data";

/**
 * コードを文字列にする
 * @param code コードを表すデータ
 * @param moduleMap モジュールの名をnamed importで使う名前
 * @param codeType JavaScriptかTypeScriptか
 */
export const toString = (
  code: data.Code,
  moduleMap: ReadonlyMap<string, identifer.Identifer>,
  codeType: data.CodeType
): string => {
  const importCode =
    [...moduleMap.entries()]
      .map(
        ([name, identifer]) =>
          "import * as " + (identifer as string) + ' from "' + name + '";'
      )
      .join("\n") + "\n";

  const definitionCode =
    code.exportDefinitionList
      .map((definition) => definitionToString(definition, moduleMap, codeType))
      .join("") + "\n";

  const statementCode = statementListToString(
    code.statementList,
    0,
    moduleMap,
    codeType
  );

  if (code.statementList.length === 0) {
    return importCode + definitionCode;
  }
  return importCode + definitionCode + statementCode;
};

const definitionToString = (
  definition: data.Definition,
  moduleMap: ReadonlyMap<string, identifer.Identifer>,
  codeType: data.CodeType
): string => {
  switch (definition._) {
    case "TypeAlias":
      if (codeType === "JavaScript") {
        return "";
      }
      return typeAliasToString(definition.typeAlias, moduleMap);

    case "Function":
      return exportFunctionToString(definition.function_, moduleMap, codeType);

    case "Variable":
      return exportVariableToString(definition.variable, moduleMap, codeType);
  }
};

const typeAliasToString = (
  typeAlias: data.TypeAlias,
  moduleMap: ReadonlyMap<string, identifer.Identifer>
): string => {
  return (
    documentToString(typeAlias.document) +
    "export type " +
    (typeAlias.name as string) +
    typeParameterListToString(typeAlias.parameterList) +
    " = " +
    typeToString(typeAlias.type_, moduleMap) +
    ";\n\n"
  );
};

const exportFunctionToString = (
  function_: data.Function_,
  moduleMap: ReadonlyMap<string, identifer.Identifer>,
  codeType: data.CodeType
): string => {
  return (
    documentToString(
      function_.document + parameterListToDocument(function_.parameterList)
    ) +
    "export const " +
    (function_.name as string) +
    " = " +
    typeParameterListToString(function_.typeParameterList) +
    "(" +
    function_.parameterList
      .map(
        (parameter) =>
          (parameter.name as string) +
          ": " +
          typeToString(parameter.type_, moduleMap)
      )
      .join(", ") +
    "): " +
    typeToString(function_.returnType, moduleMap) +
    " => " +
    lambdaBodyToString(function_.statementList, 0, moduleMap, codeType) +
    ";\n\n"
  );
};

const exportVariableToString = (
  variable: data.Variable,
  moduleMap: ReadonlyMap<string, identifer.Identifer>,
  codeType: data.CodeType
): string => {
  return (
    documentToString(variable.document) +
    "export const " +
    (variable.name as string) +
    ": " +
    typeToString(variable.type_, moduleMap) +
    " = " +
    exprToString(variable.expr, 0, moduleMap, codeType) +
    ";\n\n"
  );
};

const documentToString = (document: string): string => {
  const documentTrimmed = document.trim();
  return documentTrimmed === ""
    ? ""
    : "\n/**\n" +
        documentTrimmed
          .split("\n")
          .map((line) => (line === "" ? " *" : " * " + line))
          .join("\n") +
        "\n */\n";
};

const parameterListToDocument = (
  parameterList: ReadonlyArray<data.ParameterWithDocument>
): string =>
  parameterList.length === 0
    ? ""
    : "\n" +
      parameterList
        .map((parameter) =>
          parameter.document === ""
            ? ""
            : "@param " + (parameter.name as string) + " " + parameter.document
        )
        .join("\n");

/**
 * ラムダ式の本体 文が1つでreturn exprだった場合、returnを省略する形にする
 * @param statementList
 * @param indent
 */
export const lambdaBodyToString = (
  statementList: ReadonlyArray<data.Statement>,
  indent: number,
  moduleMap: ReadonlyMap<string, identifer.Identifer>,
  codeType: data.CodeType
): string => {
  if (statementList.length === 1 && statementList[0]._ === "Return") {
    return exprToStringWithCombineStrength(
      data.lambda([], [], data.typeVoid, []),
      statementList[0].expr,
      indent,
      moduleMap,
      codeType
    );
  }
  return statementListToString(statementList, indent, moduleMap, codeType);
};

/**
 * 式をコードに変換する
 * @param expr 式
 */
const exprToString = (
  expr: data.Expr,
  indent: number,
  moduleMap: ReadonlyMap<string, identifer.Identifer>,
  codeType: data.CodeType
): string => {
  switch (expr._) {
    case "NumberLiteral":
      return expr.value.toString();

    case "StringLiteral":
      return stringLiteralValueToString(expr.value);

    case "BooleanLiteral":
      return expr.value ? "true" : "false";

    case "UndefinedLiteral":
      return "undefined";

    case "NullLiteral":
      return "null";

    case "ArrayLiteral":
      return (
        "[" +
        expr.itemList
          .map(
            (item) =>
              (item.spread ? "..." : "") +
              exprToString(item.expr, indent, moduleMap, codeType)
          )
          .join(", ") +
        "]"
      );

    case "ObjectLiteral":
      return objectLiteralToString(
        expr.memberList,
        indent,
        moduleMap,
        codeType
      );

    case "UnaryOperator":
      return (
        expr.operator +
        exprToStringWithCombineStrength(
          expr,
          expr.expr,
          indent,
          moduleMap,
          codeType
        )
      );
    case "BinaryOperator":
      return binaryOperatorExprToString(
        expr.operator,
        expr.left,
        expr.right,
        indent,
        moduleMap,
        codeType
      );
    case "ConditionalOperator":
      return (
        exprToStringWithCombineStrength(
          expr,
          expr.condition,
          indent,
          moduleMap,
          codeType
        ) +
        "?" +
        exprToStringWithCombineStrength(
          expr,
          expr.thenExpr,
          indent,
          moduleMap,
          codeType
        ) +
        ":" +
        exprToStringWithCombineStrength(
          expr,
          expr.elseExpr,
          indent,
          moduleMap,
          codeType
        )
      );

    case "Lambda":
      return (
        typeParameterListToString(expr.typeParameterList) +
        "(" +
        expr.parameterList
          .map(
            (o) =>
              (o.name as string) + typeAnnotation(o.type_, codeType, moduleMap)
          )
          .join(", ") +
        ")" +
        typeAnnotation(expr.returnType, codeType, moduleMap) +
        " => " +
        lambdaBodyToString(expr.statementList, indent, moduleMap, codeType)
      );

    case "Variable":
      return expr.name;

    case "GlobalObjects":
      return expr.name;

    case "ImportedVariable": {
      const nameSpaceIdentifer = moduleMap.get(expr.moduleName);
      if (nameSpaceIdentifer === undefined) {
        throw Error(
          "収集されなかった, モジュールがある moduleName=" + expr.moduleName
        );
      }
      return (nameSpaceIdentifer as string) + "." + (expr.name as string);
    }

    case "Get":
      return (
        exprToStringWithCombineStrength(
          expr,
          expr.expr,
          indent,
          moduleMap,
          codeType
        ) +
        (expr.propertyName._ === "StringLiteral" &&
        identifer.isIdentifer(expr.propertyName.value)
          ? "." + expr.propertyName.value
          : "[" +
            exprToString(expr.propertyName, indent, moduleMap, codeType) +
            "]")
      );

    case "Call":
      return (
        exprToStringWithCombineStrength(
          expr,
          expr.expr,
          indent,
          moduleMap,
          codeType
        ) +
        "(" +
        expr.parameterList
          .map((e) => exprToString(e, indent, moduleMap, codeType))
          .join(", ") +
        ")"
      );

    case "New":
      return (
        "new " +
        exprToStringWithCombineStrength(
          expr,
          expr.expr,
          indent,
          moduleMap,
          codeType
        ) +
        "(" +
        expr.parameterList
          .map((e) => exprToString(e, indent, moduleMap, codeType))
          .join(", ") +
        ")"
      );

    case "TypeAssertion":
      return (
        exprToString(expr.expr, indent, moduleMap, codeType) +
        " as " +
        typeToString(expr.type_, moduleMap)
      );
  }
};

const objectLiteralToString = (
  memberList: ReadonlyArray<data.Member>,
  indent: number,
  moduleMap: ReadonlyMap<string, identifer.Identifer>,
  codeType: data.CodeType
): string => {
  return (
    "{ " +
    memberList
      .map((member) => {
        switch (member._) {
          case "Spread":
            return (
              "..." + exprToString(member.expr, indent, moduleMap, codeType)
            );
          case "KeyValue":
            return (
              (identifer.isIdentifer(member.key)
                ? member.key
                : stringLiteralValueToString(member.key)) +
              ": " +
              exprToString(member.value, indent, moduleMap, codeType)
            );
        }
      })
      .join(", ") +
    " " +
    "}"
  );
};

/**
 * 文字列を`"`で囲んでエスケープする
 */
const stringLiteralValueToString = (value: string): string => {
  return (
    '"' +
    value
      .replace(/\\/gu, "\\\\")
      .replace(/"/gu, '\\"')
      .replace(/\r\n|\n/gu, "\\n") +
    '"'
  );
};

type Associativity = "LeftToRight" | "RightToLeft";

const binaryOperatorAssociativity = (
  binaryOperator: data.BinaryOperator
): Associativity => {
  switch (binaryOperator) {
    case "**":
      return "RightToLeft";
    case "*":
    case "/":
    case "%":
    case "+":
    case "-":
    case "<<":
    case ">>":
    case ">>>":
    case "<":
    case "<=":
    case "===":
    case "!==":
    case "&":
    case "^":
    case "|":
    case "&&":
    case "||":
      return "LeftToRight";
  }
};

const binaryOperatorExprToString = (
  operator: data.BinaryOperator,
  left: data.Expr,
  right: data.Expr,
  indent: number,
  moduleMap: ReadonlyMap<string, identifer.Identifer>,
  codeType: data.CodeType
): string => {
  const operatorExprCombineStrength = exprCombineStrength({
    _: "BinaryOperator",
    operator,
    left,
    right,
  });
  const leftExprCombineStrength = exprCombineStrength(left);
  const rightExprCombineStrength = exprCombineStrength(right);
  const associativity = binaryOperatorAssociativity(operator);

  return (
    (operatorExprCombineStrength > leftExprCombineStrength ||
    (operatorExprCombineStrength === leftExprCombineStrength &&
      associativity === "RightToLeft")
      ? "(" + exprToString(left, indent, moduleMap, codeType) + ")"
      : exprToString(left, indent, moduleMap, codeType)) +
    " " +
    operator +
    " " +
    (operatorExprCombineStrength > rightExprCombineStrength ||
    (operatorExprCombineStrength === rightExprCombineStrength &&
      associativity === "LeftToRight")
      ? "(" + exprToString(right, indent, moduleMap, codeType) + ")"
      : exprToString(right, indent, moduleMap, codeType))
  );
};

const exprToStringWithCombineStrength = (
  expr: data.Expr,
  target: data.Expr,
  indent: number,
  moduleMap: ReadonlyMap<string, identifer.Identifer>,
  codeType: data.CodeType
): string => {
  const text = exprToString(target, indent, moduleMap, codeType);
  if (exprCombineStrength(expr) > exprCombineStrength(target)) {
    return "(" + text + ")";
  }
  return text;
};

const exprCombineStrength = (expr: data.Expr): number => {
  switch (expr._) {
    case "NumberLiteral":
    case "StringLiteral":
    case "BooleanLiteral":
    case "NullLiteral":
    case "UndefinedLiteral":
    case "ArrayLiteral":
    case "Variable":
    case "GlobalObjects":
    case "ImportedVariable":
      return 23;
    case "Lambda":
      return 22;
    case "ObjectLiteral":
      return 21;
    case "Get":
    case "Call":
    case "New":
      return 20;
    case "UnaryOperator":
      return 17;
    case "BinaryOperator":
      return binaryOperatorCombineStrength(expr.operator);
    case "ConditionalOperator":
      return 4;
    case "TypeAssertion":
      return 3;
  }
};

const binaryOperatorCombineStrength = (
  binaryOperator: data.BinaryOperator
): number => {
  switch (binaryOperator) {
    case "**":
      return 16;
    case "*":
    case "/":
    case "%":
      return 15;
    case "+":
    case "-":
      return 14;
    case "<<":
    case ">>":
    case ">>>":
      return 13;
    case "<":
    case "<=":
      return 12;
    case "===":
    case "!==":
      return 11;
    case "&":
      return 10;
    case "^":
      return 9;
    case "|":
      return 8;
    case "&&":
      return 6;
    case "||":
      return 5;
  }
};

export const statementListToString = (
  statementList: ReadonlyArray<data.Statement>,
  indent: number,
  moduleMap: ReadonlyMap<string, identifer.Identifer>,
  codeType: data.CodeType
): string =>
  "{\n" +
  statementList
    .map((statement) =>
      statementToTypeScriptCodeAsString(
        statement,
        indent + 1,
        moduleMap,
        codeType
      )
    )
    .join("\n") +
  "\n" +
  indentNumberToString(indent) +
  "}";

/**
 * 文をTypeScriptのコードに変換する
 * @param statement 文
 */
const statementToTypeScriptCodeAsString = (
  statement: data.Statement,
  indent: number,
  moduleMap: ReadonlyMap<string, identifer.Identifer>,
  codeType: data.CodeType
): string => {
  const indentString = indentNumberToString(indent);
  switch (statement._) {
    case "EvaluateExpr":
      return (
        indentString +
        exprToString(statement.expr, indent, moduleMap, codeType) +
        ";"
      );

    case "Set":
      return (
        indentString +
        exprToString(statement.targetObject, indent, moduleMap, codeType) +
        " " +
        (statement.operator === null ? "" : statement.operator) +
        "= " +
        exprToString(statement.expr, indent, moduleMap, codeType) +
        ";"
      );

    case "If":
      return (
        indentString +
        "if (" +
        exprToString(statement.condition, indent, moduleMap, codeType) +
        ") " +
        statementListToString(
          statement.thenStatementList,
          indent,
          moduleMap,
          codeType
        )
      );

    case "ThrowError":
      return (
        indentString +
        "throw new Error(" +
        exprToString(statement.errorMessage, indent, moduleMap, codeType) +
        ");"
      );

    case "Return":
      return (
        indentString +
        "return " +
        exprToString(statement.expr, indent, moduleMap, codeType) +
        ";"
      );

    case "ReturnVoid":
      return indentString + "return;";

    case "Continue":
      return indentString + "continue;";

    case "VariableDefinition":
      return (
        indentString +
        (statement.isConst ? "const" : "let") +
        " " +
        (statement.name as string) +
        typeAnnotation(statement.type_, codeType, moduleMap) +
        " = " +
        exprToString(statement.expr, indent, moduleMap, codeType) +
        ";"
      );

    case "FunctionDefinition":
      return functionDefinitionToString(
        statement.functionDefinition,
        indent,
        moduleMap,
        codeType
      );

    case "For":
      return (
        indentString +
        "for (let " +
        (statement.counterVariableName as string) +
        " = 0; " +
        (statement.counterVariableName as string) +
        " < " +
        exprToString(statement.untilExpr, indent, moduleMap, codeType) +
        "; " +
        (statement.counterVariableName as string) +
        " += 1)" +
        statementListToString(
          statement.statementList,
          indent,
          moduleMap,
          codeType
        )
      );

    case "ForOf":
      return (
        indentString +
        "for (const " +
        (statement.elementVariableName as string) +
        " of " +
        exprToString(statement.iterableExpr, indent, moduleMap, codeType) +
        ")" +
        statementListToString(
          statement.statementList,
          indent,
          moduleMap,
          codeType
        )
      );

    case "WhileTrue":
      return (
        indentString +
        "while (true) " +
        statementListToString(
          statement.statementList,
          indent,
          moduleMap,
          codeType
        )
      );

    case "Break":
      return indentString + "break;";

    case "Switch":
      return switchToString(statement.switch_, indent, moduleMap, codeType);
  }
};

const functionDefinitionToString = (
  functionDefinition: data.FunctionDefinition,
  indent: number,
  moduleMap: ReadonlyMap<string, identifer.Identifer>,
  codeType: data.CodeType
): string => {
  return (
    indentNumberToString(indent) +
    "const " +
    (functionDefinition.name as string) +
    " = " +
    typeParameterListToString(functionDefinition.typeParameterList) +
    "(" +
    functionDefinition.parameterList
      .map(
        (parameter) =>
          (parameter.name as string) +
          typeAnnotation(parameter.type_, codeType, moduleMap)
      )
      .join(", ") +
    ")" +
    typeAnnotation(functionDefinition.returnType, codeType, moduleMap) +
    " => " +
    lambdaBodyToString(
      functionDefinition.statementList,
      indent,
      moduleMap,
      codeType
    ) +
    ";"
  );
};

const switchToString = (
  switch_: data.Switch,
  indent: number,
  moduleMap: ReadonlyMap<string, identifer.Identifer>,
  codeType: data.CodeType
): string => {
  const indentString = indentNumberToString(indent);
  const caseIndentNumber = indent + 1;
  const caseIndentString = indentNumberToString(caseIndentNumber);
  return (
    indentString +
    "switch (" +
    exprToString(switch_.expr, indent, moduleMap, codeType) +
    ") {\n" +
    switch_.patternList
      .map(
        (pattern) =>
          caseIndentString +
          "case " +
          stringLiteralValueToString(pattern.caseTag) +
          ": " +
          statementListToString(
            pattern.statementList,
            caseIndentNumber,
            moduleMap,
            codeType
          )
      )
      .join("\n") +
    "\n" +
    indentString +
    "}"
  );
};

const indentNumberToString = (indent: number): string => "  ".repeat(indent);

/** 関数の引数と戻り値の型を文字列にする */
const functionTypeToString = (
  parameterTypeList: ReadonlyArray<data.Type>,
  returnType: data.Type,
  moduleMap: ReadonlyMap<string, identifer.Identifer>
): string => {
  let index = identifer.initialIdentiferIndex;
  const parameterList: Array<{
    name: string;
    type_: data.Type;
  }> = [];
  for (const parameter of parameterTypeList) {
    const indexAndIdentifer = identifer.createIdentifer(index, new Set());
    index = indexAndIdentifer.nextIdentiferIndex;
    parameterList.push({
      name: indexAndIdentifer.identifer,
      type_: parameter,
    });
  }

  return (
    "(" +
    parameterList
      .map(
        (parameter) =>
          parameter.name + ": " + typeToString(parameter.type_, moduleMap)
      )
      .join(", ") +
    ") => " +
    typeToString(returnType, moduleMap)
  );
};

const typeParameterListToString = (
  typeParameterList: ReadonlyArray<identifer.Identifer>
): string => {
  if (typeParameterList.length === 0) {
    return "";
  }
  return "<" + typeParameterList.join(", ") + ">";
};

/**
 * codeTypeがTypeScriptだった場合,`: string`のような型注釈をつける
 */
const typeAnnotation = (
  type_: data.Type,
  codeType: data.CodeType,
  moduleMap: ReadonlyMap<string, identifer.Identifer>
): string => {
  switch (codeType) {
    case "JavaScript":
      return "";
    case "TypeScript":
      return ": " + typeToString(type_, moduleMap);
  }
};

/**
 * 型の式をコードに変換する
 * @param type_ 型の式
 */
export const typeToString = (
  type_: data.Type,
  moduleMap: ReadonlyMap<string, identifer.Identifer>
): string => {
  switch (type_._) {
    case "Number":
      return "number";

    case "String":
      return "string";

    case "Boolean":
      return "boolean";

    case "Null":
      return "null";

    case "Never":
      return "never";

    case "Void":
      return "void";

    case "Undefined":
      return "undefined";

    case "Object":
      return (
        "{ " +
        [...type_.memberDict.entries()]
          .map(
            ([name, typeAndDocument]) =>
              documentToString(typeAndDocument.document) +
              "readonly " +
              name +
              ": " +
              typeToString(typeAndDocument.type_, moduleMap)
          )
          .join("; ") +
        " }"
      );

    case "Function":
      return functionTypeToString(type_.parameterList, type_.return, moduleMap);

    case "Union":
      return type_.types
        .map((type_) => typeToString(type_, moduleMap))
        .join(" | ");

    case "Intersection":
      return (
        typeToString(type_.left, moduleMap) +
        " & " +
        typeToString(type_.right, moduleMap)
      );

    case "WithTypeParameter":
      return (
        typeToString(type_.type_, moduleMap) +
        (type_.typeParameterList.length === 0
          ? ""
          : "<" +
            type_.typeParameterList
              .map((type_) => typeToString(type_, moduleMap))
              .join(", ") +
            ">")
      );

    case "ScopeInFile":
      return type_.name;

    case "ScopeInGlobal":
      return type_.name;

    case "ImportedType": {
      const nameSpaceIdentifer = moduleMap.get(type_.moduleName);
      if (nameSpaceIdentifer === undefined) {
        throw Error(
          "収集されなかった, モジュールがある moduleName=" + type_.moduleName
        );
      }

      return (nameSpaceIdentifer as string) + "." + (type_.name as string);
    }

    case "StringLiteral":
      return stringLiteralValueToString(type_.string_);
  }
};
