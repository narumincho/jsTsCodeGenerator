import * as generator from "../source/main";
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
  const expressImportedModule = generator.createImportNodeModule<
    ["Request", "Response"],
    []
  >(importPath, ["Request", "Response"], []);
  const globalNamespace = generator.createGlobalNamespace<
    ["Uint8Array"],
    ["console"]
  >(["Uint8Array"], ["console"]);

  const sampleCode: generator.NodeJsCode = generator.addExportVariable(
    "middleware",
    generator.typeExpr.functionReturnVoid([
      {
        name: "request",
        document: "expressのリクエスト",
        typeExpr: expressImportedModule.typeList.Request
      },
      {
        name: "response",
        document: "expressのレスポンス",
        typeExpr: expressImportedModule.typeList.Response
      }
    ]),
    generator.stringLiteral("文字列のリテラル"),
    "サンプルの文字列の変数",
    () =>
      generator.addExportVariable(
        "sorena",
        generator.typeExpr.object(
          new Map([
            ["name", { document: "", typeExpr: generator.typeExpr.typeString }]
          ])
        ),
        generator.createObjectLiteral(
          new Map([["name", generator.stringLiteral("sorena")]])
        ),
        "ドキュメント",
        () => generator.emptyNodeJsCode
      )
  );

  const start = performance.now();
  const nodeJsTypeScriptCode = generator.toNodeJsCodeAsTypeScript(sampleCode);
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
  it("not include revered word", () => {
    const nodeJsCode = {
      exportTypeAliasList: [],
      exportVariableList: [
        {
          name: "new",
          document: "newという名前の変数",
          typeExpr: generator.typeExpr.typeString,
          expr: generator.stringLiteral("newData")
        }
      ]
    };
    expect(() => {
      generator.toNodeJsCodeAsTypeScript(nodeJsCode);
    }).toThrow();
  });
  it("include function parameter name", () => {
    const expressModule = generator.createImportNodeModule<
      ["Request", "Response"],
      []
    >("express", ["Request", "Response"], []);
    const nodeJsCode: generator.NodeJsCode = {
      exportTypeAliasList: [],
      exportVariableList: [
        {
          name: "middleware",
          typeExpr: generator.typeExpr.functionReturnVoid([
            {
              name: "request",
              document: "リクエスト",
              typeExpr: expressModule.typeList.Request
            },
            {
              name: "response",
              document: "レスポンス",
              typeExpr: expressModule.typeList.Response
            }
          ]),
          document: "ミドルウェア",
          expr: generator.stringLiteral("まだ途中")
        }
      ]
    };
    const code = generator.toNodeJsCodeAsTypeScript(nodeJsCode);
    console.log(code);
    expect(code).toMatch("request");
  });
});
