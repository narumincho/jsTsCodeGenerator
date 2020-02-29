import * as generator from "../source/main";
import { data, identifer } from "../source/main";

describe("test", () => {
  const expressRequest = data.typeImported(
    "express",
    identifer.fromString("Request")
  );
  const expressResponse = data.typeImported(
    "express",
    identifer.fromString("Response")
  );

  const sampleCode: data.Code = {
    exportDefinitionList: [
      data.definitionFunction({
        name: identifer.fromString("middleware"),
        parameterList: [
          {
            name: identifer.fromString("request"),
            document: "expressのリクエスト",
            type_: expressRequest
          },
          {
            name: identifer.fromString("response"),
            document: "expressのレスポンス",
            type_: expressResponse
          }
        ],
        document: "ミドルウェア",
        returnType: data.typeVoid,
        statementList: []
      })
    ],
    statementList: []
  };
  const nodeJsTypeScriptCode = generator.generateCodeAsString(
    sampleCode,
    data.CodeType.TypeScript
  );
  console.log(nodeJsTypeScriptCode);
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
    const codeAsString = generator.generateCodeAsString(
      {
        exportDefinitionList: [
          data.definitionFunction({
            name: identifer.fromString("new"),
            document: "newという名前の関数",
            parameterList: [],
            returnType: data.typeVoid,
            statementList: []
          })
        ],
        statementList: []
      },
      data.CodeType.TypeScript
    );

    console.log("new code", codeAsString);
    expect(codeAsString).not.toMatch(/const new =/);
  });
  it("識別子として使えない文字は, 変更される", () => {
    const codeAsString = generator.generateCodeAsString(
      {
        exportDefinitionList: [
          data.definitionFunction({
            name: identifer.fromString("0name"),
            document: "0から始まる識別子",
            parameterList: [],
            returnType: data.typeVoid,
            statementList: []
          })
        ],
        statementList: []
      },
      data.CodeType.TypeScript
    );
    console.log(codeAsString);
    expect(codeAsString).not.toMatch(/const 0name/);
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
        if (!identifer.isIdentifer(createIdentiferResult.identifer)) {
          throw new Error(
            "create not identifer. identifer=" +
              (createIdentiferResult.identifer as string)
          );
        }
      }
    }).not.toThrow();
  });
  it("escape string literal", () => {
    const nodeJsCode: data.Code = {
      exportDefinitionList: [
        data.definitionVariable({
          name: identifer.fromString("stringValue"),
          document: "文字列リテラルでエスケープしているか調べる",
          type_: data.typeString,
          expr: data.stringLiteral(`

          改行
          "ダブルクオーテーション"
  `)
        })
      ],
      statementList: []
    };
    const codeAsString = generator.generateCodeAsString(
      nodeJsCode,
      data.CodeType.TypeScript
    );
    console.log(codeAsString);
    expect(codeAsString).toMatch(/\\"/);
    expect(codeAsString).toMatch(/\\n/);
  });

  it("include function parameter name", () => {
    const nodeJsCode: data.Code = {
      exportDefinitionList: [
        data.definitionFunction({
          name: identifer.fromString("middleware"),
          document: "ミドルウェア",
          parameterList: [
            {
              name: identifer.fromString("request"),
              document: "リクエスト",
              type_: data.typeImported(
                "express",
                identifer.fromString("Request")
              )
            },
            {
              name: identifer.fromString("response"),
              document: "レスポンス",
              type_: data.typeImported(
                "express",
                identifer.fromString("Response")
              )
            }
          ],
          returnType: data.typeVoid,
          statementList: [
            data.statementVariableDefinition(
              identifer.fromString("accept"),
              data.typeUnion([data.typeString, data.typeUndefined]),
              data.get(
                data.get(
                  data.variable(identifer.fromString("request")),
                  "headers"
                ),
                "accept"
              )
            ),
            data.statementIf(
              data.logicalAnd(
                data.notEqual(
                  data.variable(identifer.fromString("accept")),
                  data.undefinedLiteral
                ),
                data.callMethod(
                  data.variable(identifer.fromString("accept")),
                  "includes",
                  [data.stringLiteral("text/html")]
                )
              ),
              [
                data.statementEvaluateExpr(
                  data.callMethod(
                    data.variable(identifer.fromString("response")),
                    "setHeader",
                    [
                      data.stringLiteral("content-type"),
                      data.stringLiteral("text/html")
                    ]
                  )
                )
              ]
            )
          ]
        })
      ],
      statementList: []
    };
    const code = generator.generateCodeAsString(
      nodeJsCode,
      data.CodeType.TypeScript
    );
    console.log(code);
    expect(code).toMatch("request");
  });
  it("get array index", () => {
    const code = generator.generateCodeAsString(
      {
        exportDefinitionList: [
          data.definitionFunction({
            name: identifer.fromString("getZeroIndexElement"),
            document: "Uint8Arrayの0番目の要素を取得する",
            parameterList: [
              {
                name: identifer.fromString("array"),
                document: "Uint8Array",
                type_: data.uint8ArrayType
              }
            ],
            returnType: data.typeNumber,
            statementList: [
              data.statementReturn(
                data.getByExpr(
                  data.variable(identifer.fromString("array")),
                  data.numberLiteral(0)
                )
              )
            ]
          })
        ],
        statementList: []
      },
      data.CodeType.TypeScript
    );
    console.log(code);
    expect(code).toMatch("[0]");
  });
  const scopedCode = generator.generateCodeAsString(
    {
      exportDefinitionList: [],
      statementList: [
        data.statementLetVariableDefinition(
          identifer.fromString("sorena"),
          data.typeString,
          data.stringLiteral("それな")
        ),
        data.consoleLog(data.variable(identifer.fromString("sorena")))
      ]
    },
    data.CodeType.JavaScript
  );

  it("statementList in { } scope curly braces", () => {
    console.log(scopedCode);
    expect(scopedCode).toMatch(/\{[^{]*"それな[^}]*\}/u);
  });
  it("ESModules Browser Code not include type ", () => {
    expect(scopedCode).not.toMatch("string");
  });
  it("type parameter", () => {
    const code = generator.generateCodeAsString(
      {
        exportDefinitionList: [
          data.definitionFunction({
            name: identifer.fromString("sample"),
            document: "",
            parameterList: [],
            returnType: data.promiseType(data.typeString),
            statementList: []
          })
        ],
        statementList: []
      },
      data.CodeType.TypeScript
    );
    console.log(code);
    expect(code).toMatch("Promise<string>");
  });
  it("object literal key is escaped", () => {
    const code = generator.generateCodeAsString(
      {
        exportDefinitionList: [],
        statementList: [
          data.statementEvaluateExpr(
            data.objectLiteral(
              new Map([
                ["abc", data.numberLiteral(3)],
                ["a b c", data.stringLiteral("separated")]
              ])
            )
          )
        ]
      },
      data.CodeType.TypeScript
    );
    console.log(code);
    expect(code).toMatch(/"a b c"/u);
  });
  it("binary operator combine", () => {
    const code = generator.generateCodeAsString(
      {
        exportDefinitionList: [],
        statementList: [
          data.statementEvaluateExpr(
            data.equal(
              data.equal(
                data.addition(
                  data.multiplication(
                    data.numberLiteral(3),
                    data.numberLiteral(9)
                  ),
                  data.multiplication(
                    data.numberLiteral(7),
                    data.numberLiteral(6)
                  )
                ),
                data.addition(
                  data.addition(data.numberLiteral(2), data.numberLiteral(3)),
                  data.addition(data.numberLiteral(5), data.numberLiteral(8))
                )
              ),
              data.multiplication(
                data.numberLiteral(5),
                data.addition(data.numberLiteral(7), data.numberLiteral(8))
              )
            )
          )
        ]
      },
      data.CodeType.JavaScript
    );
    console.log(code);
    expect(code).toMatch("3*9+7*6===2+3+(5+8)===5*(7+8)");
  });
  const constEnumCode: data.Code = {
    exportDefinitionList: [
      data.definitionEnum({
        name: identifer.fromString("Color"),
        document: "色",
        tagList: [
          {
            name: identifer.fromString("Red"),
            document: "赤"
          },
          {
            name: identifer.fromString("Green"),
            document: "緑"
          },
          {
            name: identifer.fromString("Blue"),
            document: "青"
          }
        ]
      }),
      data.definitionVariable({
        name: identifer.fromString("red"),
        document: "赤",
        type_: data.typeEnumTagLiteral(
          identifer.fromString("Color"),
          identifer.fromString("Red")
        ),
        expr: data.enumTag(
          identifer.fromString("Color"),
          identifer.fromString("Red")
        )
      })
    ],
    statementList: []
  };
  it("export const enum in TypeScript", () => {
    const code = generator.generateCodeAsString(
      constEnumCode,
      data.CodeType.TypeScript
    );
    console.log(code);
    expect(code).toMatch(
      /export const enum Color[\s\S]*Red[\s\S]*Green[\s\S]*Blue[\s\S]*Color.Red/u
    );
  });
  it("export const enum in JavaScript", () => {
    const code = generator.generateCodeAsString(
      constEnumCode,
      data.CodeType.JavaScript
    );
    console.log(code);
    expect(code).toMatch(/0/u);
  });
  it("object literal return need parenthesis", () => {
    const code = generator.generateCodeAsString(
      {
        exportDefinitionList: [
          data.definitionFunction({
            name: identifer.fromString("returnObject"),
            document: "",
            parameterList: [],
            returnType: data.typeObject(
              new Map([
                ["name", { type_: data.typeString, document: "" }],
                ["age", { type_: data.typeNumber, document: "" }]
              ])
            ),
            statementList: [
              data.statementReturn(data.literal({ name: "mac", age: 10 }))
            ]
          })
        ],
        statementList: []
      },
      data.CodeType.TypeScript
    );
    console.log(code);
    expect(code).toMatch(/\(\{.*\}\)/);
  });
  it("let variable", () => {
    const v = identifer.fromString("v");
    const code = generator.generateCodeAsString(
      {
        exportDefinitionList: [],
        statementList: [
          data.statementLetVariableDefinition(
            v,
            data.typeNumber,
            data.numberLiteral(10)
          ),
          data.statementSet(data.variable(v), null, data.numberLiteral(30)),
          data.statementSet(data.variable(v), "+", data.numberLiteral(1))
        ]
      },
      data.CodeType.TypeScript
    );
    console.log(code);
    expect(code).toMatch(/let v: number = 10;[\n ]*v = 30;[\n ]*v \+= 1;/);
  });
  it("enumTagLiteral", () => {
    const code: data.Code = {
      exportDefinitionList: [
        data.definitionEnum({
          name: identifer.fromString("A"),
          document: "",
          tagList: [{ name: identifer.fromString("B"), document: "" }]
        })
      ],
      statementList: [
        data.statementLetVariableDefinition(
          identifer.fromString("a"),
          data.typeEnumTagLiteral(
            identifer.fromString("A"),
            identifer.fromString("B")
          ),
          data.enumTag(identifer.fromString("A"), identifer.fromString("B"))
        )
      ]
    };
    const codeAsString = generator.generateCodeAsString(
      code,
      data.CodeType.TypeScript
    );
    console.log(codeAsString);
    expect(codeAsString).toMatch(/A\.B/);
  });
  it("for of", () => {
    const code: data.Code = {
      exportDefinitionList: [],
      statementList: [
        data.statementForOf(
          identifer.fromString("element"),
          data.arrayLiteral([
            data.numberLiteral(1),
            data.numberLiteral(2),
            data.numberLiteral(3)
          ]),
          [data.consoleLog(data.variable(identifer.fromString("element")))]
        )
      ]
    };
    const codeAsString = generator.generateCodeAsString(
      code,
      data.CodeType.TypeScript
    );
    console.log(codeAsString);
    expect(codeAsString).toMatch(/for .* of \[1, 2, 3\]/);
  });
});
