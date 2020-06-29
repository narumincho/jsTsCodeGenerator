import * as jsTsCodeGenerator from "../source/main";
import * as prettier from "prettier";
import { data, generateTypeScriptCode } from "@narumincho/type";
import { promises as fileSystem } from "fs";

const codeTypeName = "CodeType";
const codeName = "Code";
const exportDefinitionName = "ExportDefinition";
const statementName = "Statement";
const typeAliasName = "TypeAlias";
const functionName = "Function";
const variableName = "Variable";
const identiferName = "Identifer";

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
    body: data.CustomTypeDefinitionBody.Product([]),
  },
  {
    name: functionName,
    description: "",
    typeParameterList: [],
    body: data.CustomTypeDefinitionBody.Product([]),
  },
  {
    name: variableName,
    description: "",
    typeParameterList: [],
    body: data.CustomTypeDefinitionBody.Product([]),
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
