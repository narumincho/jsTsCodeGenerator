import { performance } from "perf_hooks";
import * as generator from "../source/main";
import { expr, typeExpr } from "../source/main";
import * as identifer from "../source/identifer";

describe("test", () => {
  const expressType = typeExpr.importedTypeList("express", [
    "Request",
    "Response"
  ] as const);

  const sampleCode: generator.Code = {
    exportTypeAliasMap: new Map(),
    exportConstEnumMap: new Map(),
    exportFunctionMap: new Map([
      [
        "middleware",
        {
          document: "ミドルウェア",
          statementList: [],
          parameterList: [
            {
              name: "request",
              document: "expressのリクエスト",
              typeExpr: expressType.Request
            },
            {
              name: "response",
              document: "expressのレスポンス",
              typeExpr: expressType.Response
            }
          ],
          returnType: null
        }
      ]
    ]),
    statementList: []
  };
  const start = performance.now();
  const nodeJsTypeScriptCode = generator.toNodeJsOrBrowserCodeAsTypeScript(
    sampleCode
  );
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
    expect(nodeJsTypeScriptCode).toMatch("express");
  });
  it("not include revered word", () => {
    expect(() => {
      generator.toNodeJsOrBrowserCodeAsTypeScript({
        exportTypeAliasMap: new Map(),
        exportConstEnumMap: new Map(),
        exportFunctionMap: new Map([
          [
            "new",
            {
              name: "new",
              document: "newという名前の関数",
              parameterList: [],
              returnType: null,
              statementList: []
            }
          ]
        ]),
        statementList: []
      });
    }).toThrow();
  });
  it("識別子として使えない文字はエラー", () => {
    expect(() => {
      generator.toNodeJsOrBrowserCodeAsTypeScript({
        exportTypeAliasMap: new Map(),
        exportConstEnumMap: new Map(),
        exportFunctionMap: new Map([
          [
            "0name",
            {
              document: "0から始まる識別子",
              parameterList: [],
              returnType: null,
              statementList: []
            }
          ]
        ]),
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
      exportTypeAliasMap: new Map(),
      exportConstEnumMap: new Map(),
      exportFunctionMap: new Map([
        [
          "stringValue",
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
      ]),
      statementList: []
    };
    const codeAsString = generator.toNodeJsOrBrowserCodeAsTypeScript(
      nodeJsCode
    );
    console.log(codeAsString);
    expect(codeAsString).toMatch(/\\"/);
    expect(codeAsString).toMatch(/\\n/);
  });

  it("include function parameter name", () => {
    const expressType = typeExpr.importedTypeList("express", [
      "Request",
      "Response"
    ] as const);
    const nodeJsCode: generator.Code = {
      exportTypeAliasMap: new Map(),
      exportConstEnumMap: new Map(),
      exportFunctionMap: new Map([
        [
          "middleware",
          {
            document: "ミドルウェア",
            parameterList: [
              {
                name: "request",
                document: "リクエスト",
                typeExpr: expressType.Request
              },
              {
                name: "response",
                document: "レスポンス",
                typeExpr: expressType.Response
              }
            ],
            returnType: null,
            statementList: [
              expr.variableDefinition(
                ["accept"],
                typeExpr.union([typeExpr.typeString, typeExpr.typeUndefined]),
                expr.get(
                  expr.get(expr.localVariable(["request"]), "headers"),
                  "accept"
                )
              ),
              expr.ifStatement(
                expr.logicalAnd(
                  expr.notEqual(
                    expr.localVariable(["accept"]),
                    expr.undefinedLiteral
                  ),
                  expr.callMethod(expr.localVariable(["accept"]), "includes", [
                    expr.stringLiteral("text/html")
                  ])
                ),
                [
                  expr.evaluateExpr(
                    expr.callMethod(
                      expr.localVariable(["response"]),
                      "setHeader",
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
      ]),
      statementList: []
    };
    const code = generator.toNodeJsOrBrowserCodeAsTypeScript(nodeJsCode);
    console.log(code);
    expect(code).toMatch("request");
  });
  it("get array index", () => {
    const code = generator.toNodeJsOrBrowserCodeAsTypeScript({
      exportTypeAliasMap: new Map(),
      exportConstEnumMap: new Map(),
      exportFunctionMap: new Map([
        [
          "getZeroIndexElement",
          {
            document: "Uint8Arrayの0番目の要素を取得する",
            parameterList: [
              {
                name: "array",
                document: "Uint8Array",
                typeExpr: typeExpr.uint8ArrayType
              }
            ],
            returnType: typeExpr.typeNumber,
            statementList: [
              expr.returnStatement(
                expr.getByExpr(expr.localVariable(["array"]), expr.literal(0))
              )
            ]
          }
        ]
      ]),
      statementList: []
    });
    console.log(code);
    expect(code).toMatch("[0]");
  });
  const scopedCode = generator.toESModulesBrowserCode({
    exportTypeAliasMap: new Map(),
    exportFunctionMap: new Map(),
    exportConstEnumMap: new Map(),
    statementList: [
      expr.variableDefinition(
        ["sorena"],
        typeExpr.typeString,
        expr.stringLiteral("それな")
      ),
      expr.consoleLog(expr.localVariable(["sorena"]))
    ]
  });

  it("statementList in { } scope curly braces", () => {
    console.log(scopedCode);
    expect(scopedCode).toMatch(/\{[^{]*"それな[^}]*\}/u);
  });
  it("ESModules Browser Code not include type ", () => {
    expect(scopedCode).not.toMatch("string");
  });
  it("type parameter", () => {
    const code = generator.toNodeJsOrBrowserCodeAsTypeScript({
      exportFunctionMap: new Map([
        [
          "sample",
          {
            document: "",
            parameterList: [],
            returnType: typeExpr.promiseType(typeExpr.typeString),
            statementList: []
          }
        ]
      ]),
      exportTypeAliasMap: new Map(),
      exportConstEnumMap: new Map(),
      statementList: []
    });
    console.log(code);
    expect(code).toMatch("Promise<string>");
  });
  it("object literal key is escaped", () => {
    const code = generator.toNodeJsOrBrowserCodeAsTypeScript({
      exportFunctionMap: new Map(),
      exportTypeAliasMap: new Map(),
      exportConstEnumMap: new Map(),
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
    const code = generator.toESModulesBrowserCode({
      exportFunctionMap: new Map(),
      exportTypeAliasMap: new Map(),
      exportConstEnumMap: new Map(),
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
  const constEnumCode: generator.Code = {
    exportTypeAliasMap: new Map(),
    exportConstEnumMap: new Map([
      [
        "Color",
        new Map([
          ["Red", 0],
          ["Green", 1],
          ["Blue", 2]
        ])
      ]
    ]),
    exportFunctionMap: new Map([
      [
        "red",
        {
          document: "赤",
          parameterList: [],
          returnType: typeExpr.enumTagLiteral("Color", "Red"),
          statementList: [expr.returnStatement(expr.enumTag("Color", "Red"))]
        }
      ]
    ]),
    statementList: [expr.evaluateExpr(expr.enumTag("Color", "Red"))]
  };
  it("export const enum in TypeScript", () => {
    const code = generator.toNodeJsOrBrowserCodeAsTypeScript(constEnumCode);
    console.log(code);
    expect(code).toMatch(
      /export const enum Color[\s\S]*Red[\s\S]*Green[\s\S]*Blue[\s\S]*Color.Red/u
    );
  });
  it("export const enum in JavaScript", () => {
    const code = generator.toESModulesBrowserCode(constEnumCode);
    console.log(code);
    expect(code).toMatch(/0/u);
  });
  it("object literal return need parenthesis", () => {
    const code = generator.toNodeJsOrBrowserCodeAsTypeScript({
      exportTypeAliasMap: new Map(),
      exportConstEnumMap: new Map(),
      exportFunctionMap: new Map([
        [
          "returnObject",
          {
            document: "",
            parameterList: [],
            returnType: typeExpr.object(
              new Map([
                ["name", { typeExpr: typeExpr.typeString, document: "" }],
                ["age", { typeExpr: typeExpr.typeNumber, document: "" }]
              ])
            ),
            statementList: [
              expr.returnStatement(expr.literal({ name: "mac", age: 10 }))
            ]
          }
        ]
      ]),
      statementList: []
    });
    console.log(code);
    expect(code).toMatch(/\(\{.*\}\)/);
  });
  it("let variable", () => {
    const code = generator.toNodeJsOrBrowserCodeAsTypeScript({
      exportTypeAliasMap: new Map(),
      exportConstEnumMap: new Map(),
      exportFunctionMap: new Map(),
      statementList: [
        expr.letVariableDefinition(
          ["v"],
          typeExpr.typeNumber,
          expr.numberLiteral(10)
        ),
        expr.set(expr.localVariable(["v"]), null, expr.numberLiteral(30)),
        expr.set(expr.localVariable(["v"]), "+", expr.numberLiteral(1))
      ]
    });
    console.log(code);
    expect(code).toMatch(/let b: number = 10;[\n ]*b = 30;[\n ]*b \+= 1;/);
  });
  it("enumTagLiteral", () => {
    const code: generator.Code = {
      exportConstEnumMap: new Map([["A", new Map([["B", 0]])]]),
      exportFunctionMap: new Map(),
      exportTypeAliasMap: new Map(),
      statementList: [
        generator.expr.variableDefinition(
          ["a"],
          generator.typeExpr.enumTagLiteral("A", "B"),
          generator.expr.enumTag("A", "B")
        )
      ]
    };
    const codeAsString = generator.toNodeJsOrBrowserCodeAsTypeScript(code);
    console.log(codeAsString);
    expect(codeAsString).toMatch(/A\.B/);
  });
  it("for of", () => {
    const code: generator.Code = {
      exportConstEnumMap: new Map(),
      exportFunctionMap: new Map(),
      exportTypeAliasMap: new Map(),
      statementList: [
        expr.forOfStatement(
          ["element"],
          expr.arrayLiteral([
            expr.numberLiteral(1),
            expr.numberLiteral(2),
            expr.numberLiteral(3)
          ]),
          [expr.consoleLog(expr.localVariable(["element"]))]
        )
      ]
    };
    const codeAsString = generator.toNodeJsOrBrowserCodeAsTypeScript(code);
    console.log(codeAsString);
    expect(codeAsString).toMatch(/for .* of \[1, 2, 3\]/);
  });
});
