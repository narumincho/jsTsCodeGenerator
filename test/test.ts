import * as main from "../source/main";
import { performance } from "perf_hooks";

describe("test", () => {
  /*
   * 作りたいコード
   *
   * import * as api from "./api";
   *
   * const leb128toNumber = (number):number => {
   *
   * }
   *
   * export const middleware = (request, response) => {
   *   if(request.accept==="text/html") {
   *      response.setHeader("", "");
   *      response.send("")
   *   }
   *   const a = request.body;
   *   if(a[0] === 0 ){
   *      response.send(api.getUser(a[32]))
   *   }
   *   response.send()
   * }
   *
   */
  const importPath = "./sampleModulePath";
  const sampleCode: main.NodeJsCodeWithId = main.importNodeModule(
    importPath,
    {
      typeList: {},
      variableList: {}
    },
    0,
    () =>
      main.addExportVariable(
        "sampleVar",
        main.string,
        main.stringLiteral("文字列のリテラル"),
        "サンプルの文字列の変数",
        () => main.emptyNodeJsCode
      )
  ).code;

  const start = performance.now();
  const nodeJsTypeScriptCode = main.toNodeJsCodeAsTypeScript(sampleCode);
  const time = performance.now() - start;
  console.log(time.toString() + "ms");
  console.log(nodeJsTypeScriptCode);
  it("performance", () => {
    expect(time).toBeLessThan(10000);
  });
  it("return string", () => {
    expect(typeof nodeJsTypeScriptCode).toBe("string");
  });
  it("include import keyword", () => {
    expect(nodeJsTypeScriptCode).toMatch(/import/);
  });
  it("include import path", () => {
    expect(nodeJsTypeScriptCode).toMatch(importPath);
  });
});
