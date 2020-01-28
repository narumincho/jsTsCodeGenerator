import { performance } from "perf_hooks";
import * as generator from "../source/main";
import { expr, typeExpr } from "../source/main";

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
          document: "newという名前の関数",
          parameterList: [],
          returnType: null,
          statementList: []
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
      exportFunctionList: [
        {
          name: "stringValue",
          document: "文字列リテラルでエスケープしているか調べる",
          parameterList: [],
          returnType: generator.typeExpr.typeString,
          statementList: [
            expr.returnStatement(
              expr.stringLiteral(`

              改行
              "ダブルクオーテーション"
      `)
            )
          ]
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
      exportFunctionList: [
        {
          name: "middleware",
          document: "ミドルウェア",
          parameterList: [
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
          returnType: null,
          statementList: [
            expr.variableDefinition(
              typeExpr.union([typeExpr.typeString, typeExpr.typeUndefined]),
              expr.getProperty(
                expr.getProperty(expr.argument(0, 0), "headers"),
                "accept"
              )
            ),
            expr.ifStatement(
              expr.logicalAnd(
                expr.notEqual(expr.localVariable(0, 0), expr.undefinedLiteral),
                expr.call(
                  expr.getProperty(expr.localVariable(0, 0), "includes"),
                  [expr.stringLiteral("text/html")]
                )
              ),
              [
                expr.evaluateExpr(
                  expr.call(
                    expr.getProperty(expr.argument(1, 1), "setHeader"),
                    [
                      expr.stringLiteral("content-type"),
                      expr.stringLiteral("text/html")
                    ]
                  )
                )
              ]
            )
          ]
        }
      ]
    };
    const code = generator.toNodeJsCodeAsTypeScript(nodeJsCode);
    console.log(code);
    expect(code).toMatch("request");
  });
});
