import * as main from "../source/main";
import * as typeExpr from "../source/typeExpr";
import { performance } from "perf_hooks";

describe("test", () => {
  /*
   * 作りたいコード
   *
   * import * as api from "./api";
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
  const importPath = "./express";
  const expressImportedModule = main.createImportNodeModule(
    importPath,
    ["Request", "Response"],
    []
  );
  const globalNamespace = main.createGlobalNamespace<
    ["Uint8Array"],
    ["console"]
  >(["Uint8Array"], ["console"]);

  const sampleCode: main.NodeJsCode = main.addExportVariable(
    "middleware",
    typeExpr.functionReturnVoid([]),
    main.stringLiteral("文字列のリテラル"),
    "サンプルの文字列の変数",
    () =>
      main.addExportVariable(
        "sorena",
        typeExpr.object(
          new Map([["name", { document: "", typeExpr: typeExpr.typeString }]])
        ),
        main.createObjectLiteral(
          new Map([
            ["name", main.stringLiteral("sorena")],
            ["consoleFromGlobal", globalNamespace.variableList.console]
          ])
        ),
        "ドキュメント",
        () => main.emptyNodeJsCode
      )
  );

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
