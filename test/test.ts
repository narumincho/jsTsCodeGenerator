import * as generator from "../source/main";
import { performance } from "perf_hooks";

describe("test", () => {
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
    exportFunctionList: [
      {
        name: "middleware",
        document: "ミドルウェア",
        statementList: [],
        parameterList: [
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
        ],
        returnType: null
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
    const nodeJsCode: generator.NodeJsCode = {
      exportTypeAliasList: [],
      exportFunctionList: [
        {
          name: "new",
          document: "newという名前の変数",
          parameterList: [],
          returnType: null,
          statementList: [
            
          ]
          typeExpr: generator.typeExpr.typeString,
          expr: generator.expr.stringLiteral("newData")
        }
      ]
    };
    expect(() => {
      generator.toNodeJsCodeAsTypeScript(nodeJsCode);
    }).toThrow();
  });
  it("escape string literal", () => {
    const nodeJsCode: generator.NodeJsCode = {
      exportTypeAliasList: [],
      exportVariableList: [
        {
          name: "stringValue",
          document: "文字列リテラルでエスケープしているか調べる",
          expr: generator.expr.stringLiteral(`

        改行
        "ダブルクオーテーション"
`),
          typeExpr: generator.typeExpr.typeString
        }
      ]
    };
    const codeAsString = generator.toNodeJsCodeAsTypeScript(nodeJsCode);
    console.log(codeAsString);
    expect(codeAsString).toMatch(/\\"/);
    expect(codeAsString).toMatch(/\\n/);
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
          expr: generator.expr.createLambdaReturnVoid<["request", "response"]>(
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
              generator.expr.ifWithVoidReturn(
                generator.expr.getProperty(
                  generator.expr.getProperty(args[0], "headers"),
                  "accept"
                ),
                generator.expr.call(
                  generator.expr.getProperty(args[0], "send"),
                  [
                    generator.expr.stringLiteral(
                      "HTMLをリクエストした。ドキュメントとクライアント用のコードを返したい"
                    )
                  ]
                ),
                generator.expr.call(
                  generator.expr.getProperty(args[0], "send"),
                  [generator.expr.stringLiteral("APIとして動作したい")]
                )
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
