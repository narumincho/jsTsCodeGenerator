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

  const sampleCode: generator.NodeJsCode = {
    exportTypeAliasList: [],
    exportVariableList: [
      {
        name: "middleware",
        document: "ミドルウェア",
        expr: generator.stringLiteral("文字列のリテラル"),
        typeExpr: generator.typeExpr.functionReturnVoid([
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
        ])
      },
      {
        name: "sorena",
        document: "ドキュメント",
        typeExpr: generator.typeExpr.object(
          new Map([
            ["name", { document: "", typeExpr: generator.typeExpr.typeString }]
          ])
        ),
        expr: generator.createObjectLiteral(
          new Map([["name", generator.stringLiteral("sorena")]])
        )
      }
    ]
  };
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
          expr: generator.createLambdaReturnVoid<["request", "response"]>(
            [
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
            ],
            args =>
              generator.add(
                generator.add(
                  generator.stringLiteral("途中"),
                  generator.getProperty(
                    generator.getProperty(args[0], "headers"),
                    "accept"
                  )
                ),
                generator.call(generator.getProperty(args[0], "send"), [
                  generator.stringLiteral("レスポンス")
                ])
              )
          )
        }
      ]
    };
    const code = generator.toNodeJsCodeAsTypeScript(nodeJsCode);
    console.log(code);
    expect(code).toMatch("request");
  });
});
