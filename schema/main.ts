import * as definition from "./definition";
import * as jsTsCodeGenerator from "../source/main";
import * as prettier from "prettier";
import { promises as fileSystem } from "fs";
import { generateTypeScriptCode } from "@narumincho/type";

const code = prettier.format(
  jsTsCodeGenerator.generateCodeAsString(
    generateTypeScriptCode(definition.customTypeDefinitionList),
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
