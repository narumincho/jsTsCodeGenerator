import { performance } from "perf_hooks";
import * as generator from "../source/main";
import { expr, typeExpr } from "../source/main";
import * as identifer from "../source/identifer";

describe("test", () => {
  const importPath = "./express";
  const expressImportedModule = generator.createImportNodeModule<
    ["Request", "Response"],
    []
  >(importPath, ["Request", "Response"], []);

  const sampleCode: generator.Code = {
    exportTypeAliasList: [],
    exportFunctionList: [
      generator.exportFunction({
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
      })
    ],
    statementList: []
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
    expect(() => {
      generator.toNodeJsCodeAsTypeScript({
        exportTypeAliasList: [],
        exportFunctionList: [
          generator.exportFunction({
            name: "new",
            document: "newという名前の関数",
            parameterList: [],
            returnType: null,
            statementList: []
          })
        ],
        statementList: []
      });
    }).toThrow();
  });
  it("識別子として使えない文字はエラー", () => {
    expect(() => {
      generator.toNodeJsCodeAsTypeScript({
        exportTypeAliasList: [],
        exportFunctionList: [
          generator.exportFunction({
            name: "0name",
            document: "0から始まる識別子",
            parameterList: [],
            returnType: null,
            statementList: []
          })
        ],
        statementList: []
      });
    }).toThrow();
  });
  it("識別子の生成で識別子に使えない文字が含まれているかどうか", () => {
    expect(() => {
      const reserved: ReadonlySet<string> = new Set();
      let index = identifer.initialIdentiferIndex;
      for (let i = 0; i < 999; i++) {
        const createIdentiferResult = identifer.createIdentifer(
          index,
          reserved
        );
        index = createIdentiferResult.nextIdentiferIndex;
        identifer.checkIdentiferThrow(
          "test",
          "test",
          createIdentiferResult.identifer
        );
      }
    }).not.toThrow();
  });
  it("escape string literal", () => {
    const nodeJsCode: generator.Code = {
      exportTypeAliasList: [],
      exportFunctionList: [
        generator.exportFunction({
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
        })
      ],
      statementList: []
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
    const nodeJsCode: generator.Code = {
      exportTypeAliasList: [],
      exportFunctionList: [
        generator.exportFunction({
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
              expr.get(expr.get(expr.argument(0, 0), "headers"), "accept")
            ),
            expr.ifStatement(
              expr.logicalAnd(
                expr.notEqual(expr.localVariable(0, 0), expr.undefinedLiteral),
                expr.callMethod(expr.localVariable(0, 0), "includes", [
                  expr.stringLiteral("text/html")
                ])
              ),
              [
                expr.evaluateExpr(
                  expr.callMethod(expr.argument(1, 1), "setHeader", [
                    expr.stringLiteral("content-type"),
                    expr.stringLiteral("text/html")
                  ])
                )
              ]
            )
          ]
        })
      ],
      statementList: []
    };
    const code = generator.toNodeJsCodeAsTypeScript(nodeJsCode);
    console.log(code);
    expect(code).toMatch("request");
  });
  it("get array index", () => {
    const global = generator.createGlobalNamespace<["Uint8Array"], []>(
      ["Uint8Array"],
      []
    );
    const code = generator.toNodeJsCodeAsTypeScript({
      exportTypeAliasList: [],
      exportFunctionList: [
        generator.exportFunction({
          name: "getZeroIndexElement",
          document: "Uint8Arrayの0番目の要素を取得する",
          parameterList: [
            {
              name: "array",
              document: "Uint8Array",
              typeExpr: global.typeList.Uint8Array
            }
          ],
          returnType: typeExpr.typeNumber,
          statementList: [
            expr.returnStatement(
              expr.getByExpr(expr.argument(0, 0), expr.literal(0))
            )
          ]
        })
      ],
      statementList: []
    });
    console.log(code);
    expect(code).toMatch("[0]");
  });
  const sorenaGlobal = generator.createGlobalNamespace<[], ["console"]>(
    [],
    ["console"]
  );

  const sorenaCode = generator.toESModulesBrowserCode({
    exportTypeAliasList: [],
    exportFunctionList: [],
    statementList: [
      expr.variableDefinition(
        typeExpr.typeString,
        expr.stringLiteral("それな")
      ),
      expr.evaluateExpr(
        expr.callMethod(sorenaGlobal.variableList.console, "log", [
          expr.localVariable(0, 0)
        ])
      )
    ]
  });

  it("statementList in { } ", () => {
    console.log(sorenaCode);
    expect(sorenaCode).toMatch(/\{[^{]*"それな[^}]*\}/u);
  });
  it("ESModules Browser Code not include type ", () => {
    expect(sorenaCode).not.toMatch(/string/u);
  });
  it("object literal key is escaped", () => {
    const code = generator.toNodeJsCodeAsTypeScript({
      exportFunctionList: [],
      exportTypeAliasList: [],
      statementList: [
        expr.evaluateExpr(
          expr.objectLiteral(
            new Map([
              ["abc", expr.numberLiteral(3)],
              ["a b c", expr.stringLiteral("separated")]
            ])
          )
        )
      ]
    });
    console.log(code);
    expect(code).toMatch(/"a b c"/u);
  });
  it("binary operator combine", () => {
    const code = generator.toNodeJsCodeAsTypeScript({
      exportFunctionList: [],
      exportTypeAliasList: [],
      statementList: [
        expr.evaluateExpr(
          expr.equal(
            expr.equal(
              expr.addition(
                expr.multiplication(
                  expr.numberLiteral(3),
                  expr.numberLiteral(9)
                ),
                expr.multiplication(
                  expr.numberLiteral(7),
                  expr.numberLiteral(6)
                )
              ),
              expr.addition(
                expr.addition(expr.numberLiteral(2), expr.numberLiteral(3)),
                expr.addition(expr.numberLiteral(5), expr.numberLiteral(8))
              )
            ),
            expr.multiplication(
              expr.numberLiteral(5),
              expr.addition(expr.numberLiteral(7), expr.numberLiteral(8))
            )
          )
        )
      ]
    });
    console.log(code);
    expect(code).toMatch("3*9+7*6===2+3+(5+8)===5*(7+8)");
  });
});
