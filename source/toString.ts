import * as identifer from "./identifer";
import * as data from "./data";

/**
 * コードを文字列にする
 */
export const toString = (
  code: data.Code,
  collectedData: data.CollectedData,
  codeType: data.CodeType
): string => {
  const importCode =
    [...collectedData.importedModuleNameIdentiferMap.entries()]
      .map(
        ([name, identifer]) =>
          "import * as " + (identifer as string) + ' from "' + name + '";'
      )
      .join("\n") + "\n";

  const definitionCode =
    code.exportDefinitionList
      .map(definition =>
        definitionToString(definition, collectedData, codeType)
      )
      .join("") + "\n";

  const statementCode = statementListToString(
    code.statementList,
    0,
    collectedData,
    codeType
  );

  if (code.statementList.length === 0) {
    return importCode + definitionCode;
  }
  return importCode + definitionCode + statementCode;
};

const definitionToString = (
  definition: data.Definition,
  collectedData: data.CollectedData,
  codeType: data.CodeType
): string => {
  switch (definition._) {
    case "TypeAlias":
      if (codeType === "JavaScript") {
        return "";
      }
      return typeAliasToString(definition.typeAlias, collectedData);

    case "Enum":
      if (codeType === "JavaScript") {
        return "";
      }
      return enumToString(definition.enum_);

    case "Function":
      return functionToString(definition.function_, collectedData, codeType);

    case "Variable":
      return variableToString(definition.variable, collectedData, codeType);
  }
};

const typeAliasToString = (
  typeAlias: data.TypeAlias,
  collectedData: data.CollectedData
): string => {
  return (
    documentToString(typeAlias.document) +
    "export type " +
    (typeAlias.name as string) +
    (typeAlias.parameterList.length === 0
      ? ""
      : "<" +
        typeAlias.parameterList.map(parameter => parameter).join(", ") +
        ">") +
    " = " +
    typeToString(typeAlias.type_, collectedData) +
    ";\n\n"
  );
};

const enumToString = (enum_: data.Enum): string => {
  return (
    documentToString(enum_.document) +
    "export const enum " +
    (enum_.name as string) +
    " {\n" +
    enum_.tagList
      .map(tag => documentToString(tag.document) + "  " + (tag.name as string))
      .join(",\n") +
    "\n}\n\n"
  );
};

const functionToString = (
  function_: data.Function,
  collectedData: data.CollectedData,
  codeType: data.CodeType
): string => {
  return (
    documentToString(
      function_.document +
        "\n" +
        parameterListToDocument(function_.parameterList)
    ) +
    "export const " +
    (function_.name as string) +
    " = " +
    (function_.typeParameterList.length === 0
      ? ""
      : "<" +
        function_.typeParameterList
          .map(typeParameter => typeParameter as string)
          .join(", ") +
        ">") +
    "(" +
    function_.parameterList
      .map(
        parameter =>
          (parameter.name as string) +
          ": " +
          typeToString(parameter.type_, collectedData)
      )
      .join(", ") +
    "): " +
    typeToString(function_.returnType, collectedData) +
    " => " +
    lambdaBodyToString(function_.statementList, 0, collectedData, codeType) +
    ";\n\n"
  );
};

const variableToString = (
  variable: data.Variable,
  collectedData: data.CollectedData,
  codeType: data.CodeType
): string => {
  return (
    documentToString(variable.document) +
    "export const " +
    (variable.name as string) +
    ": " +
    typeToString(variable.type_, collectedData) +
    " = " +
    exprToString(variable.expr, 0, collectedData, codeType) +
    ";\n\n"
  );
};

const documentToString = (document: string): string =>
  document === ""
    ? ""
    : "/**\n" +
      document
        .split("\n")
        .map(line => (line === "" ? " *" : " * " + line))
        .join("\n") +
      "\n */\n";

const parameterListToDocument = (
  parameterList: ReadonlyArray<data.ParameterWithDocument>
): string =>
  parameterList
    .map(parameter =>
      parameter.document === ""
        ? ""
        : "@param " +
          (parameter.name as string) +
          " " +
          parameter.document +
          "\n"
    )
    .join("");

/**
 * ラムダ式の本体 文が1つでreturn exprだった場合、returnを省略する形にする
 * @param statementList
 * @param indent
 */
export const lambdaBodyToString = (
  statementList: ReadonlyArray<data.Statement>,
  indent: number,
  collectedData: data.CollectedData,
  codeType: data.CodeType
): string => {
  if (statementList.length === 1 && statementList[0]._ === "Return") {
    return exprToStringWithCombineStrength(
      data.lambda([], data.typeVoid, []),
      statementList[0].expr,
      indent,
      collectedData,
      codeType
    );
  }
  return statementListToString(statementList, indent, collectedData, codeType);
};

/**
 * 式をコードに変換する
 * @param expr 式
 */
const exprToString = (
  expr: data.Expr,
  indent: number,
  collectedData: data.CollectedData,
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
        expr.exprList
          .map(element =>
            exprToString(element, indent, collectedData, codeType)
          )
          .join("," + codeTypeSpace(codeType)) +
        "]"
      );

    case "ObjectLiteral":
      return (
        "{" +
        codeTypeSpace(codeType) +
        [...expr.memberList.entries()]
          .map(
            ([key, value]) =>
              (identifer.isIdentifer(key)
                ? key
                : stringLiteralValueToString(key)) +
              (":" + codeTypeSpace(codeType)) +
              exprToString(value, indent, collectedData, codeType)
          )
          .join(", ") +
        codeTypeSpace(codeType) +
        "}"
      );

    case "UnaryOperator":
      return (
        expr.operator +
        exprToStringWithCombineStrength(
          expr,
          expr.expr,
          indent,
          collectedData,
          codeType
        )
      );
    case "BinaryOperator":
      return binaryOperatorExprToString(
        expr.operator,
        expr.left,
        expr.right,
        indent,
        collectedData,
        codeType
      );
    case "ConditionalOperator":
      return (
        exprToStringWithCombineStrength(
          expr,
          expr.condition,
          indent,
          collectedData,
          codeType
        ) +
        "?" +
        exprToStringWithCombineStrength(
          expr,
          expr.thenExpr,
          indent,
          collectedData,
          codeType
        ) +
        ":" +
        exprToStringWithCombineStrength(
          expr,
          expr.elseExpr,
          indent,
          collectedData,
          codeType
        )
      );

    case "Lambda":
      switch (codeType) {
        case "TypeScript":
          return (
            "(" +
            expr.parameterList
              .map(
                o =>
                  (o.name as string) +
                  ": " +
                  typeToString(o.type_, collectedData)
              )
              .join(", ") +
            "): " +
            typeToString(expr.returnType, collectedData) +
            "=>" +
            lambdaBodyToString(
              expr.statementList,
              indent,
              collectedData,
              codeType
            )
          );
        case "JavaScript":
          return (
            "(" +
            expr.parameterList.map(o => o.name).join(",") +
            ")=>" +
            lambdaBodyToString(
              expr.statementList,
              indent,
              collectedData,
              codeType
            )
          );
      }
      break;

    case "Variable":
      return expr.name;

    case "ImportedVariable": {
      const nameSpaceIdentifer = collectedData.importedModuleNameIdentiferMap.get(
        expr.moduleName
      );
      if (nameSpaceIdentifer === undefined) {
        throw Error(
          "収集されなかった, モジュールがある moduleName=" + expr.moduleName
        );
      }
      return (nameSpaceIdentifer as string) + "." + expr.name;
    }

    case "Get":
      return (
        exprToStringWithCombineStrength(
          expr,
          expr.expr,
          indent,
          collectedData,
          codeType
        ) +
        (expr.propertyName._ === "StringLiteral" &&
        identifer.isIdentifer(expr.propertyName.value)
          ? "." + expr.propertyName.value
          : "[" +
            exprToString(expr.propertyName, indent, collectedData, codeType) +
            "]")
      );

    case "Call":
      return (
        exprToStringWithCombineStrength(
          expr,
          expr.expr,
          indent,
          collectedData,
          codeType
        ) +
        "(" +
        expr.parameterList
          .map(e => exprToString(e, indent, collectedData, codeType))
          .join("," + codeTypeSpace(codeType)) +
        ")"
      );

    case "New":
      return (
        "new " +
        exprToStringWithCombineStrength(
          expr,
          expr.expr,
          indent,
          collectedData,
          codeType
        ) +
        "(" +
        expr.parameterList
          .map(e => exprToString(e, indent, collectedData, codeType))
          .join("," + codeTypeSpace(codeType)) +
        ")"
      );

    case "EnumTag":
      switch (codeType) {
        case "JavaScript": {
          const tagList = collectedData.enumTagListMap.get(expr.typeName);
          if (tagList === undefined) {
            throw new Error(
              "Enumの型を収集できなかった enum type name =" +
                (expr.typeName as string)
            );
          }
          return (
            tagList.indexOf(expr.tagName).toString() +
            "/* " +
            (expr.tagName as string) +
            " */"
          );
        }
        case "TypeScript":
          return (expr.typeName as string) + "." + (expr.tagName as string);
      }
      break;

    case "BuiltIn":
      return builtInToString(expr.builtIn);
  }
};

const codeTypeSpace = (codeType: data.CodeType): string =>
  codeType === "TypeScript" ? " " : "";

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
  collectedData: data.CollectedData,
  codeType: data.CodeType
): string => {
  const operatorExprCombineStrength = exprCombineStrength({
    _: "BinaryOperator",
    operator,
    left,
    right
  });
  const leftExprCombineStrength = exprCombineStrength(left);
  const rightExprCombineStrength = exprCombineStrength(right);
  const associativity = binaryOperatorAssociativity(operator);

  return (
    (operatorExprCombineStrength > leftExprCombineStrength ||
    (operatorExprCombineStrength === leftExprCombineStrength &&
      associativity === "RightToLeft")
      ? "(" + exprToString(left, indent, collectedData, codeType) + ")"
      : exprToString(left, indent, collectedData, codeType)) +
    (codeType === "TypeScript" ? " " + operator + " " : operator) +
    (operatorExprCombineStrength > rightExprCombineStrength ||
    (operatorExprCombineStrength === rightExprCombineStrength &&
      associativity === "LeftToRight")
      ? "(" + exprToString(right, indent, collectedData, codeType) + ")"
      : exprToString(right, indent, collectedData, codeType))
  );
};

const exprToStringWithCombineStrength = (
  expr: data.Expr,
  target: data.Expr,
  indent: number,
  collectedData: data.CollectedData,
  codeType: data.CodeType
): string => {
  if (exprCombineStrength(expr) > exprCombineStrength(target)) {
    return "(" + exprToString(target, indent, collectedData, codeType) + ")";
  }
  return exprToString(target, indent, collectedData, codeType);
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
    case "ImportedVariable":
    case "BuiltIn":
      return 23;
    case "Lambda":
      return 22;
    case "ObjectLiteral":
      return 21;
    case "Get":
    case "Call":
    case "New":
    case "EnumTag":
      return 20;
    case "UnaryOperator":
      return 17;
    case "BinaryOperator":
      return binaryOperatorCombineStrength(expr.operator);
    case "ConditionalOperator":
      return 4;
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
  collectedData: data.CollectedData,
  codeType: data.CodeType
): string =>
  "{\n" +
  statementList
    .map(statement =>
      statementToTypeScriptCodeAsString(
        statement,
        indent + 1,
        collectedData,
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
  collectedData: data.CollectedData,
  codeType: data.CodeType
): string => {
  const indentString = indentNumberToString(indent);
  switch (statement._) {
    case "EvaluateExpr":
      return (
        indentString +
        exprToString(statement.expr, indent, collectedData, codeType) +
        ";"
      );

    case "Set":
      return (
        indentString +
        exprToString(statement.targetObject, indent, collectedData, codeType) +
        codeTypeSpace(codeType) +
        (statement.operator === null ? "" : statement.operator) +
        "=" +
        codeTypeSpace(codeType) +
        exprToString(statement.expr, indent, collectedData, codeType) +
        ";"
      );

    case "If":
      return (
        indentString +
        "if (" +
        exprToString(statement.condition, indent, collectedData, codeType) +
        ") " +
        statementListToString(
          statement.thenStatementList,
          indent,
          collectedData,
          codeType
        )
      );

    case "ThrowError":
      return (
        indentString +
        "throw new Error(" +
        exprToString(statement.errorMessage, indent, collectedData, codeType) +
        ");"
      );

    case "Return":
      return (
        indentString +
        "return " +
        exprToString(statement.expr, indent, collectedData, codeType) +
        ";"
      );

    case "ReturnVoid":
      return indentString + "return;";

    case "Continue":
      return indentString + "continue;";

    case "VariableDefinition":
      switch (codeType) {
        case "TypeScript":
          return (
            indentString +
            (statement.isConst ? "const" : "let") +
            " " +
            (statement.name as string) +
            ": " +
            typeToString(statement.type_, collectedData) +
            " = " +
            exprToString(statement.expr, indent, collectedData, codeType) +
            ";"
          );
        case "JavaScript":
          return (
            indentString +
            (statement.isConst ? "const" : "let") +
            " " +
            (statement.name as string) +
            "=" +
            exprToString(statement.expr, indent, collectedData, codeType) +
            ";"
          );
      }
      break;

    case "FunctionDefinition":
      switch (codeType) {
        case "TypeScript":
          return (
            indentString +
            "const " +
            (statement.name as string) +
            " = (" +
            statement.parameterList
              .map(
                parameter =>
                  (parameter.name as string) +
                  ": " +
                  typeToString(parameter.type_, collectedData)
              )
              .join(", ") +
            "): " +
            typeToString(statement.returnType, collectedData) +
            "=>" +
            lambdaBodyToString(
              statement.statementList,
              indent,
              collectedData,
              codeType
            ) +
            ";"
          );
        case "JavaScript":
          return (
            indentString +
            "const " +
            (statement.name as string) +
            "=(" +
            statement.parameterList.map(parameter => parameter.name).join(",") +
            ")=>" +
            lambdaBodyToString(
              statement.statementList,
              indent,
              collectedData,
              codeType
            ) +
            ";"
          );
      }
      break;

    case "For":
      return (
        indentString +
        "for (let " +
        (statement.counterVariableName as string) +
        " = 0; " +
        (statement.counterVariableName as string) +
        " < " +
        exprToString(statement.untilExpr, indent, collectedData, codeType) +
        ";" +
        (statement.counterVariableName as string) +
        "+= 1)" +
        statementListToString(
          statement.statementList,
          indent,
          collectedData,
          codeType
        )
      );

    case "ForOf":
      return (
        indentString +
        "for (const " +
        (statement.elementVariableName as string) +
        " of " +
        exprToString(statement.iterableExpr, indent, collectedData, codeType) +
        ")" +
        statementListToString(
          statement.statementList,
          indent,
          collectedData,
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
          collectedData,
          codeType
        )
      );

    case "Break":
      return indentString + "break;";

    case "Switch":
      return switchToString(statement.switch_, indent, collectedData, codeType);
  }
};

const switchToString = (
  switch_: data.Switch,
  indent: number,
  collectedData: data.CollectedData,
  codeType: data.CodeType
): string => {
  const indentString = indentNumberToString(indent);
  const caseIndentNumber = indent + 1;
  const caseIndentString = indentNumberToString(caseIndentNumber);
  return (
    indentString +
    "switch (" +
    exprToString(switch_.expr, indent, collectedData, codeType) +
    ") {\n" +
    switch_.patternList
      .map(
        pattern =>
          caseIndentString +
          "case " +
          stringLiteralValueToString(pattern.caseTag) +
          ": " +
          statementListToString(
            pattern.statementList.concat(
              data.statementReturn(pattern.returnExpr)
            ),
            caseIndentNumber,
            collectedData,
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

export const builtInToString = (
  builtInObjects: data.BuiltInVariable
): string => {
  return builtInObjects;
};

/** 関数の引数と戻り値の型を文字列にする */
const functionTypeToString = (
  parameterTypeList: ReadonlyArray<data.Type>,
  returnType: data.Type,
  collectedData: data.CollectedData
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
      type_: parameter
    });
  }

  return (
    "(" +
    parameterList
      .map(
        parameter =>
          parameter.name + ": " + typeToString(parameter.type_, collectedData)
      )
      .join(", ") +
    ") => " +
    typeToString(returnType, collectedData)
  );
};
/**
 * 型の式をコードに変換する
 * @param type_ 型の式
 */
export const typeToString = (
  type_: data.Type,
  collectedData: data.CollectedData
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
        [...type_.memberList.entries()]
          .map(
            ([name, typeAndDocument]) =>
              name + ": " + typeToString(typeAndDocument.type_, collectedData)
          )
          .join("; ") +
        " }"
      );

    case "Function":
      return functionTypeToString(
        type_.parameterList,
        type_.return,
        collectedData
      );

    case "EnumTagLiteral":
      return (type_.typeName as string) + "." + (type_.tagName as string);

    case "Union":
      return type_.types
        .map(type_ => typeToString(type_, collectedData))
        .join(" | ");

    case "WithTypeParameter":
      return (
        typeToString(type_.type_, collectedData) +
        "<" +
        type_.typeParameterList
          .map(type_ => typeToString(type_, collectedData))
          .join(", ") +
        ">"
      );

    case "GlobalType":
      return type_.name;

    case "ImportedType": {
      const nameSpaceIdentifer = collectedData.importedModuleNameIdentiferMap.get(
        type_.moduleName
      );
      if (nameSpaceIdentifer === undefined) {
        throw Error(
          "収集されなかった, モジュールがある moduleName=" + type_.moduleName
        );
      }

      return (nameSpaceIdentifer as string) + "." + (type_.name as string);
    }

    case "BuiltIn":
      return builtInTypeToString(type_.builtIn);

    case "StringLiteral":
      return stringLiteralValueToString(type_.string_);
  }
};

const builtInTypeToString = (builtInType: data.BuiltInType): string => {
  return builtInType;
};
