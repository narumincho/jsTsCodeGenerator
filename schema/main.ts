import * as jsTsCodeGenerator from "../source/main";
import * as prettier from "prettier";
import { data, generateTypeScriptCode } from "@narumincho/type";
import { promises as fileSystem } from "fs";

const codeTypeName = "CodeType";
const codeName = "Code";
const exportDefinitionName = "ExportDefinition";
const statementName = "Statement";
const typeAliasName = "TypeAlias";
const functionName = "Function_";
const variableName = "Variable";
const identiferName = "Identifer";
const typeName = "Type";
const parameterWithDocumentName = "ParameterWithDocument";
const parameterName = "Parameter";
const exprName = "Expr";
const unaryOperatorName = "UnaryOperator";
const binaryOperatorName = "BinaryOperator";

const codeTypeType = data.Type.Custom({
  name: codeTypeName,
  parameterList: [],
});
const codeType = data.Type.Custom({
  name: codeName,
  parameterList: [],
});
const exportDefinitionType = data.Type.Custom({
  name: exportDefinitionName,
  parameterList: [],
});
const statementType = data.Type.Custom({
  name: statementName,
  parameterList: [],
});
const typeAliasType = data.Type.Custom({
  name: typeAliasName,
  parameterList: [],
});
const functionType = data.Type.Custom({
  name: functionName,
  parameterList: [],
});
const variableType = data.Type.Custom({
  name: variableName,
  parameterList: [],
});
const identiferType = data.Type.Custom({
  name: identiferName,
  parameterList: [],
});
const typeType = data.Type.Custom({
  name: typeName,
  parameterList: [],
});
const parameterWithDocumentType = data.Type.Custom({
  name: parameterWithDocumentName,
  parameterList: [],
});
const parameterType = data.Type.Custom({
  name: parameterName,
  parameterList: [],
});
const exprType = data.Type.Custom({
  name: exprName,
  parameterList: [],
});
const unaryOperatorType = data.Type.Custom({
  name: unaryOperatorName,
  parameterList: [],
});
const binaryOperatorType = data.Type.Custom({
  name: binaryOperatorName,
  parameterList: [],
});

const customTypeDefinitionList: ReadonlyArray<data.CustomTypeDefinition> = [
  {
    name: codeTypeName,
    description: "出力するコードの種類",
    typeParameterList: [],
    body: data.CustomTypeDefinitionBody.Sum([
      {
        name: "JavaScript",
        description: "JavaScript",
        parameter: data.Maybe.Nothing(),
      },
      {
        name: "TypeScript",
        description: "TypeScript",
        parameter: data.Maybe.Nothing(),
      },
    ]),
  },
  {
    name: codeName,
    description:
      "TypeScriptやJavaScriptのコードを表現する. TypeScriptでも出力できるように型情報をつける必要がある",
    typeParameterList: [],
    body: data.CustomTypeDefinitionBody.Product([
      {
        name: "exportDefinitionList",
        description: "外部に公開する定義",
        type: data.Type.List(exportDefinitionType),
      },
      {
        name: "statementList",
        description: "定義した後に実行するコード",
        type: data.Type.List(statementType),
      },
    ]),
  },
  {
    name: exportDefinitionName,
    description: "外部に公開する定義",
    typeParameterList: [],
    body: data.CustomTypeDefinitionBody.Sum([
      {
        name: "TypeAlias",
        description: "TypeAlias. `export type T = {}`",
        parameter: data.Maybe.Just(typeAliasType),
      },
      {
        name: "Function",
        description: "Function `export const f = () => {}`",
        parameter: data.Maybe.Just(functionType),
      },
      {
        name: "Variable",
        description: "Variable `export const v = {}`",
        parameter: data.Maybe.Just(variableType),
      },
    ]),
  },
  {
    name: typeAliasName,
    description: "TypeAlias. `export type T = {}`",
    typeParameterList: [],
    body: data.CustomTypeDefinitionBody.Product([
      {
        name: "name",
        description: "型の名前",
        type: identiferType,
      },
      {
        name: "typeParameterList",
        description: "型パラメーターのリスト",
        type: data.Type.List(identiferType),
      },
      {
        name: "document",
        description: "ドキュメント",
        type: data.Type.String,
      },
      {
        name: "type",
        description: "型本体",
        type: typeType,
      },
    ]),
  },
  {
    name: functionName,
    description: "",
    typeParameterList: [],
    body: data.CustomTypeDefinitionBody.Product([
      {
        name: "name",
        description: "外部に公開する関数の名前",
        type: identiferType,
      },
      {
        name: "document",
        description: "ドキュメント",
        type: data.Type.String,
      },
      {
        name: "typeParameterList",
        description: "型パラメーターのリスト",
        type: data.Type.List(identiferType),
      },
      {
        name: "parameterList",
        description: "パラメーター",
        type: data.Type.List(parameterWithDocumentType),
      },
      {
        name: "returnType",
        description: "戻り値の型",
        type: typeType,
      },
      {
        name: "statementList",
        description: "関数の本体",
        type: statementType,
      },
    ]),
  },
  {
    name: parameterWithDocumentName,
    description:
      "ドキュメント付きの関数のパラメーター. パラメーター名, ドキュメント, 型",
    typeParameterList: [],
    body: data.CustomTypeDefinitionBody.Product([
      {
        name: "name",
        description: "パラメーター名",
        type: identiferType,
      },
      {
        name: "document",
        description: "ドキュメント",
        type: data.Type.String,
      },
      {
        name: "type",
        description: "パラメーターの型",
        type: typeType,
      },
    ]),
  },
  {
    name: parameterName,
    description: "関数のパラメーター. パラメーター名, ドキュメント",
    typeParameterList: [],
    body: data.CustomTypeDefinitionBody.Product([
      {
        name: "name",
        description: "パラメーター名",
        type: identiferType,
      },
      {
        name: "type",
        description: "パラメーターの型",
        type: typeType,
      },
    ]),
  },
  {
    name: variableName,
    description: "",
    typeParameterList: [],
    body: data.CustomTypeDefinitionBody.Product([
      {
        name: "name",
        description: "変数の名前",
        type: identiferType,
      },
      {
        name: "document",
        description: "ドキュメント",
        type: data.Type.String,
      },
      {
        name: "type",
        description: "変数の型",
        type: typeType,
      },
      {
        name: "expr",
        description: "変数の式",
        type: exprType,
      },
    ]),
  },
  {
    name: unaryOperatorName,
    description: "単項演算子",
    typeParameterList: [],
    body: data.CustomTypeDefinitionBody.Sum([
      {
        name: "Minus",
        description: "-",
        parameter: data.Maybe.Nothing(),
      },
      {
        name: "BitwiseNot",
        description: "~",
        parameter: data.Maybe.Nothing(),
      },
      {
        name: "LogicalNot",
        description: "!",
        parameter: data.Maybe.Nothing(),
      },
    ]),
  },
  {
    name: binaryOperatorName,
    description: "2項演算子",
    typeParameterList: [],
    body: data.CustomTypeDefinitionBody.Sum([
      {
        name: "Exponentiation",
        description: "**",
        parameter: data.Maybe.Nothing(),
      },
      {
        name: "Multiplication",
        description: "*",
        parameter: data.Maybe.Nothing(),
      },
      {
        name: "Division",
        description: "/",
        parameter: data.Maybe.Nothing(),
      },
      {
        name: "Remainder",
        description: "%",
        parameter: data.Maybe.Nothing(),
      },
      {
        name: "Addition",
        description: "+",
        parameter: data.Maybe.Nothing(),
      },
      {
        name: "Subtraction",
        description: "-",
        parameter: data.Maybe.Nothing(),
      },
      {
        name: "LeftShift",
        description: "<<",
        parameter: data.Maybe.Nothing(),
      },
      {
        name: "SignedRightShift",
        description: ">>",
        parameter: data.Maybe.Nothing(),
      },
      {
        name: "UnsignedRightShift",
        description: ">>>",
        parameter: data.Maybe.Nothing(),
      },
      {
        name: "LessThan",
        description: "<",
        parameter: data.Maybe.Nothing(),
      },
      {
        name: "LessThanOrEqual",
        description: "<=",
        parameter: data.Maybe.Nothing(),
      },
      {
        name: "Equal",
        description: "===",
        parameter: data.Maybe.Nothing(),
      },
      {
        name: "NotEqual",
        description: "!==",
        parameter: data.Maybe.Nothing(),
      },
      {
        name: "BitwiseAnd",
        description: "&",
        parameter: data.Maybe.Nothing(),
      },
      {
        name: "BitwiseXor",
        description: "^",
        parameter: data.Maybe.Nothing(),
      },
      {
        name: "BitwiseOr",
        description: "|",
        parameter: data.Maybe.Nothing(),
      },
      {
        name: "LogicalAnd",
        description: "&&",
        parameter: data.Maybe.Nothing(),
      },
      {
        name: "LogicalOr",
        description: "||",
        parameter: data.Maybe.Nothing(),
      },
    ]),
  },
  {
    name: statementName,
    description: "",
    typeParameterList: [],
    body: data.CustomTypeDefinitionBody.Product([]),
  },
  {
    name: identiferName,
    description: "TypeScriptの識別子として使える文字",
    typeParameterList: [],
    body: data.CustomTypeDefinitionBody.Sum([
      {
        name: "Identifer",
        description:
          '**直接 Identifer.Identifer("name") と指定してはいけない!! TypeScriptの識別子として使える文字としてチェックできないため**',
        parameter: data.Maybe.Just(data.Type.String),
      },
    ]),
  },
];

const code = prettier.format(
  jsTsCodeGenerator.generateCodeAsString(
    generateTypeScriptCode(customTypeDefinitionList),
    "TypeScript"
  ),
  {
    parser: "typescript",
  }
);

const outFilePath = "./source/newData.ts";

fileSystem.writeFile(outFilePath, code).then(() => {
  console.log("output newData.ts");
});
