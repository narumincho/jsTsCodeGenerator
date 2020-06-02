import * as nType from "@narumincho/type";
import { data } from "@narumincho/type";
import * as jsTsCodeGenerator from "../source/main";
import { promises as fileSystem } from "fs";
import * as prettier from "prettier";

const codeTypeName = "CodeType";
const codeTypeType = data.Type.Custom({
  name: codeTypeName,
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
];

const code = prettier.format(
  jsTsCodeGenerator.generateCodeAsString(
    nType.generateTypeScriptCode(customTypeDefinitionList),
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
