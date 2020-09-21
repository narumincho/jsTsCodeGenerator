import * as definition from "./definition";
import * as definyCore from "definy-core";
import * as jsTsCodeGenerator from "../source/main";
import * as prettier from "prettier";
import { promises as fileSystem } from "fs";

const code = prettier.format(
  jsTsCodeGenerator.generateCodeAsString(
    definyCore.generateTypeScriptCode(definition.customTypeDefinitionList),
    "TypeScript"
  ),
  {
    parser: "typescript",
  }
);

const outFilePath = "./source/data.ts";

fileSystem.writeFile(outFilePath, code).then(() => {
  console.log("output data.ts");
});
