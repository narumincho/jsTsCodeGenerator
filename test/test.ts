import * as data from "../source/data";
import {
  Code,
  ExportDefinition,
  Expr,
  Member,
  Statement,
  Type,
} from "../source/newData";
import { generateCodeAsString, identifer } from "../source/main";

describe("test", () => {
  const expressRequest = Type.ImportedType({
    moduleName: "express",
    name: identifer.fromString("Request"),
  });
  const expressResponse = Type.ImportedType({
    moduleName: "express",
    name: identifer.fromString("Response"),
  });

  const sampleCode: Code = {
    exportDefinitionList: [
      ExportDefinition.Function({
        name: identifer.fromString("middleware"),
        typeParameterList: [],
        parameterList: [
          {
            name: identifer.fromString("request"),
            document: "expressのリクエスト",
            type: expressRequest,
          },
          {
            name: identifer.fromString("response"),
            document: "expressのレスポンス",
            type: expressResponse,
          },
        ],
        document: "ミドルウェア",
        returnType: Type.Void,
        statementList: [],
      }),
    ],
    statementList: [],
  };
  const nodeJsTypeScriptCode = generateCodeAsString(sampleCode, "TypeScript");
  console.log(nodeJsTypeScriptCode);
  it("return string", () => {
    expect(typeof nodeJsTypeScriptCode).toBe("string");
  });
  it("include import keyword", () => {
    expect(nodeJsTypeScriptCode).toMatch("import");
  });
  it("include import path", () => {
    expect(nodeJsTypeScriptCode).toMatch("express");
  });
  it("not include revered word", () => {
    const codeAsString = generateCodeAsString(
      {
        exportDefinitionList: [
          ExportDefinition.Function({
            name: identifer.fromString("new"),
            document: "newという名前の関数",
            typeParameterList: [],
            parameterList: [],
            returnType: Type.Void,
            statementList: [],
          }),
        ],
        statementList: [],
      },
      "TypeScript"
    );

    console.log("new code", codeAsString);
    expect(codeAsString).not.toMatch(/const new =/u);
  });
  it("識別子として使えない文字は, 変更される", () => {
    const codeAsString = generateCodeAsString(
      {
        exportDefinitionList: [
          ExportDefinition.Function({
            name: identifer.fromString("0name"),
            document: "0から始まる識別子",
            typeParameterList: [],
            parameterList: [],
            returnType: Type.Void,
            statementList: [],
          }),
        ],
        statementList: [],
      },
      "TypeScript"
    );
    console.log(codeAsString);
    expect(codeAsString).not.toMatch(/const 0name/u);
  });
  it("識別子の生成で識別子に使えない文字が含まれているかどうか", () => {
    expect(() => {
      const reserved: ReadonlySet<string> = new Set();
      let index = identifer.initialIdentiferIndex;
      for (let i = 0; i < 999; i += 1) {
        const createIdentiferResult = identifer.createIdentifer(
          index,
          reserved
        );
        index = createIdentiferResult.nextIdentiferIndex;
        if (!identifer.isIdentifer(createIdentiferResult.identifer.string)) {
          throw new Error(
            "create not identifer. identifer=" +
              createIdentiferResult.identifer.string
          );
        }
      }
    }).not.toThrow();
  });
  it("escape string literal", () => {
    const nodeJsCode: Code = {
      exportDefinitionList: [
        ExportDefinition.Variable({
          name: identifer.fromString("stringValue"),
          document: "文字列リテラルでエスケープしているか調べる",
          type: Type.String,
          expr: Expr.StringLiteral(`

          改行
          "ダブルクオーテーション"
  `),
        }),
      ],
      statementList: [],
    };
    const codeAsString = generateCodeAsString(nodeJsCode, "TypeScript");
    console.log(codeAsString);
    expect(codeAsString).toMatch(/\\"/u);
    expect(codeAsString).toMatch(/\\n/u);
  });

  it("include function parameter name", () => {
    const nodeJsCode: Code = {
      exportDefinitionList: [
        ExportDefinition.Function({
          name: identifer.fromString("middleware"),
          document: "ミドルウェア",
          typeParameterList: [],
          parameterList: [
            {
              name: identifer.fromString("request"),
              document: "リクエスト",
              type: Type.ImportedType({
                moduleName: "express",
                name: identifer.fromString("Request"),
              }),
            },
            {
              name: identifer.fromString("response"),
              document: "レスポンス",
              type: Type.ImportedType({
                moduleName: "express",
                name: identifer.fromString("Response"),
              }),
            },
          ],
          returnType: Type.Void,
          statementList: [
            Statement.VariableDefinition({
              name: identifer.fromString("accept"),
              type: Type.Union([Type.String, Type.Undefined]),
              isConst: true,
              expr: data.get(
                data.get(
                  Expr.Variable(identifer.fromString("request")),
                  "headers"
                ),
                "accept"
              ),
            }),
            Statement.If({
              condition: Expr.BinaryOperator({
                left: Expr.BinaryOperator({
                  left: Expr.Variable(identifer.fromString("accept")),
                  operator: "NotEqual",
                  right: Expr.UndefinedLiteral,
                }),
                operator: "LogicalAnd",
                right: data.callMethod(
                  Expr.Variable(identifer.fromString("accept")),
                  "includes",
                  [Expr.StringLiteral("text/html")]
                ),
              }),
              thenStatementList: [
                Statement.EvaluateExpr(
                  data.callMethod(
                    Expr.Variable(identifer.fromString("response")),
                    "setHeader",
                    [
                      Expr.StringLiteral("content-type"),
                      Expr.StringLiteral("text/html"),
                    ]
                  )
                ),
              ],
            }),
          ],
        }),
      ],
      statementList: [],
    };
    const code = generateCodeAsString(nodeJsCode, "TypeScript");
    console.log(code);
    expect(code).toMatch("request");
  });
  it("get array index", () => {
    const code = generateCodeAsString(
      {
        exportDefinitionList: [
          ExportDefinition.Function({
            name: identifer.fromString("getZeroIndexElement"),
            document: "Uint8Arrayの0番目の要素を取得する",
            typeParameterList: [],
            parameterList: [
              {
                name: identifer.fromString("array"),
                document: "Uint8Array",
                type: data.uint8ArrayType,
              },
            ],
            returnType: Type.Number,
            statementList: [
              Statement.Return(
                Expr.Get({
                  expr: Expr.Variable(identifer.fromString("array")),
                  propertyExpr: Expr.NumberLiteral(0),
                })
              ),
            ],
          }),
        ],
        statementList: [],
      },
      "TypeScript"
    );
    console.log(code);
    expect(code).toMatch("[0]");
  });
  const scopedCode = generateCodeAsString(
    {
      exportDefinitionList: [],
      statementList: [
        Statement.VariableDefinition({
          name: identifer.fromString("sorena"),
          isConst: false,
          type: Type.String,
          expr: Expr.StringLiteral("それな"),
        }),
        data.consoleLog(Expr.Variable(identifer.fromString("sorena"))),
      ],
    },
    "JavaScript"
  );

  it("statementList in { } scope curly braces", () => {
    console.log(scopedCode);
    expect(scopedCode).toMatch(/\{[^{]*"それな[^}]*\}/u);
  });
  it("ESModules Browser Code not include type ", () => {
    expect(scopedCode).not.toMatch("string");
  });
  it("type parameter", () => {
    const code = generateCodeAsString(
      {
        exportDefinitionList: [
          ExportDefinition.Function({
            name: identifer.fromString("sample"),
            document: "",
            typeParameterList: [],
            parameterList: [],
            returnType: data.promiseType(Type.String),
            statementList: [],
          }),
        ],
        statementList: [],
      },
      "TypeScript"
    );
    console.log(code);
    expect(code).toMatch("Promise<string>");
  });
  it("object literal key is escaped", () => {
    const code = generateCodeAsString(
      {
        exportDefinitionList: [],
        statementList: [
          Statement.EvaluateExpr(
            Expr.ObjectLiteral([
              Member.KeyValue({ key: "abc", value: Expr.NumberLiteral(3) }),
              Member.KeyValue({
                key: "a b c",
                value: Expr.StringLiteral("separated"),
              }),
            ])
          ),
        ],
      },
      "TypeScript"
    );
    console.log(code);
    expect(code).toMatch(/"a b c"/u);
  });
  it("binary operator combine", () => {
    const code = generateCodeAsString(
      {
        exportDefinitionList: [],
        statementList: [
          Statement.EvaluateExpr(
            data.equal(
              data.equal(
                data.addition(
                  data.multiplication(
                    Expr.NumberLiteral(3),
                    Expr.NumberLiteral(9)
                  ),
                  data.multiplication(
                    Expr.NumberLiteral(7),
                    Expr.NumberLiteral(6)
                  )
                ),
                data.addition(
                  data.addition(Expr.NumberLiteral(2), Expr.NumberLiteral(3)),
                  data.addition(Expr.NumberLiteral(5), Expr.NumberLiteral(8))
                )
              ),
              data.multiplication(
                Expr.NumberLiteral(5),
                data.addition(Expr.NumberLiteral(7), Expr.NumberLiteral(8))
              )
            )
          ),
        ],
      },
      "JavaScript"
    );
    console.log(code);
    expect(code).toMatch("3 * 9 + 7 * 6 === 2 + 3 + (5 + 8) === 5 * (7 + 8)");
  });
  it("object literal return need parenthesis", () => {
    const code = generateCodeAsString(
      {
        exportDefinitionList: [
          ExportDefinition.Function({
            name: identifer.fromString("returnObject"),
            document: "",
            typeParameterList: [],
            parameterList: [],
            returnType: data.typeObject(
              new Map([
                ["name", { required: true, type: Type.String, document: "" }],
                ["age", { required: true, type: Type.Number, document: "" }],
              ])
            ),
            statementList: [
              Statement.Return(
                data.objectLiteral([
                  data.memberKeyValue("name", Expr.StringLiteral("mac")),
                  data.memberKeyValue("age", Expr.NumberLiteral(10)),
                ])
              ),
            ],
          }),
        ],
        statementList: [],
      },
      "TypeScript"
    );
    console.log(code);
    expect(code).toMatch(/\(\{.*\}\)/u);
  });
  it("let variable", () => {
    const v = identifer.fromString("v");
    const code = generateCodeAsString(
      {
        exportDefinitionList: [],
        statementList: [
          data.statementLetVariableDefinition(
            v,
            Type.Number,
            Expr.NumberLiteral(10)
          ),
          data.statementSet(Expr.Variable(v), null, Expr.NumberLiteral(30)),
          data.statementSet(Expr.Variable(v), "+", Expr.NumberLiteral(1)),
        ],
      },
      "TypeScript"
    );
    console.log(code);
    expect(code).toMatch(/let v: number = 10;[\n ]*v = 30;[\n ]*v \+= 1;/u);
  });
  it("for of", () => {
    const code: data.Code = {
      exportDefinitionList: [],
      statementList: [
        data.statementForOf(
          identifer.fromString("element"),
          data.arrayLiteral([
            { expr: Expr.NumberLiteral(1), spread: false },
            { expr: Expr.NumberLiteral(2), spread: false },
            {
              expr: data.arrayLiteral([
                { expr: Expr.NumberLiteral(3), spread: false },
                { expr: Expr.NumberLiteral(4), spread: false },
                { expr: Expr.NumberLiteral(5), spread: false },
              ]),
              spread: true,
            },
          ]),
          [data.consoleLog(Expr.Variable(identifer.fromString("element")))]
        ),
      ],
    };
    const codeAsString = generateCodeAsString(code, "TypeScript");
    console.log(codeAsString);
    expect(codeAsString).toMatch(/for .* of \[1, 2, \.\.\.\[3, 4, 5\] *\]/u);
  });
  it("switch", () => {
    const code: data.Code = {
      exportDefinitionList: [
        ExportDefinition.TypeAlias({
          name: identifer.fromString("Result"),
          document: "Result型",
          parameterList: [
            identifer.fromString("error"),
            identifer.fromString("ok"),
          ],
          type: data.typeUnion([
            data.typeObject(
              new Map([
                [
                  "_",
                  {
                    required: true,
                    type: Type.StringLiteral("Ok"),
                    document: "",
                  },
                ],
                [
                  "ok",
                  {
                    required: true,
                    type: data.typeScopeInGlobal(identifer.fromString("ok")),
                    document: "",
                  },
                ],
              ])
            ),
            data.typeObject(
              new Map([
                [
                  "_",
                  {
                    required: true,
                    type: Type.StringLiteral("Error"),
                    document: "Error",
                  },
                ],
                [
                  "error",
                  {
                    required: true,
                    type: data.typeScopeInGlobal(identifer.fromString("error")),
                    document: "",
                  },
                ],
              ])
            ),
          ]),
        }),
        ExportDefinition.Function({
          name: identifer.fromString("switchSample"),
          document: "switch文のテスト",
          typeParameterList: [
            identifer.fromString("ok"),
            identifer.fromString("error"),
          ],
          parameterList: [
            {
              name: identifer.fromString("value"),
              document: "",
              type: data.typeWithParameter(
                data.typeScopeInGlobal(identifer.fromString("Result")),
                [
                  data.typeScopeInGlobal(identifer.fromString("ok")),
                  data.typeScopeInGlobal(identifer.fromString("error")),
                ]
              ),
            },
          ],
          returnType: Type.String,
          statementList: [
            data.statementSwitch({
              expr: data.get(Expr.Variable(identifer.fromString("value")), "_"),
              patternList: [
                {
                  caseTag: "Ok",
                  statementList: [
                    Statement.Return(
                      data.callMethod(
                        data.get(
                          Expr.Variable(identifer.fromString("value")),
                          "ok"
                        ),
                        "toString",
                        []
                      )
                    ),
                  ],
                },
                {
                  caseTag: "Error",
                  statementList: [
                    Statement.Return(
                      data.callMethod(
                        data.get(
                          Expr.Variable(identifer.fromString("value")),
                          "error"
                        ),
                        "toString",
                        []
                      )
                    ),
                  ],
                },
              ],
            }),
          ],
        }),
      ],
      statementList: [],
    };
    const codeAsString = generateCodeAsString(code, "TypeScript");
    console.log(codeAsString);
    expect(codeAsString).toMatch(/switch \(.+\) \{\n +case .+:/u);
  });
  it("Type Assertion", () => {
    const code: data.Code = {
      exportDefinitionList: [],
      statementList: [
        Statement.EvaluateExpr(
          data.typeAssertion(data.objectLiteral([]), data.dateType)
        ),
      ],
    };
    const codeAsString = generateCodeAsString(code, "TypeScript");
    console.log(codeAsString);
    expect(codeAsString).toMatch(/as Date/u);
  });
  it("Type Intersection", () => {
    const code: data.Code = {
      exportDefinitionList: [
        ExportDefinition.TypeAlias({
          name: identifer.fromString("SampleIntersectionType"),
          document: "",
          parameterList: [],
          type: data.typeIntersection(data.dateType, data.uint8ArrayType),
        }),
      ],
      statementList: [],
    };
    const codeAsString = generateCodeAsString(code, "TypeScript");
    console.log(codeAsString);
    expect(codeAsString).toMatch(/Date & Uint8Array/u);
  });

  it("object literal spread syntax", () => {
    const code: data.Code = {
      exportDefinitionList: [],
      statementList: [
        data.statementVariableDefinition(
          identifer.fromString("value"),
          data.typeObject(
            new Map([
              ["a", { required: true, type: Type.String, document: "" }],
              ["b", { required: true, type: Type.Number, document: "" }],
            ])
          ),
          data.objectLiteral([
            data.memberKeyValue("a", Expr.StringLiteral("aValue")),
            data.memberKeyValue("b", Expr.NumberLiteral(123)),
          ])
        ),
        data.consoleLog(
          data.objectLiteral([
            data.memberSpread(Expr.Variable(identifer.fromString("value"))),
            data.memberKeyValue("b", Expr.NumberLiteral(987)),
          ])
        ),
      ],
    };
    const codeAsString = generateCodeAsString(code, "TypeScript");
    console.log(codeAsString);
    expect(codeAsString).toMatch(/\{ *\.\.\.value *, *b: 987 \}/u);
  });

  it("type property document", () => {
    const code: data.Code = {
      exportDefinitionList: [
        ExportDefinition.TypeAlias({
          name: identifer.fromString("Time"),
          document: "初期のDefinyで使う時間の内部表現",
          parameterList: [],
          type: data.typeObject(
            new Map([
              [
                "day",
                {
                  required: true,
                  type: Type.Number,
                  document:
                    "1970-01-01からの経過日数. マイナスになることもある",
                },
              ],
              [
                "millisecond",
                {
                  required: true,
                  type: Type.Number,
                  document:
                    "日にちの中のミリ秒. 0 to 86399999 (=1000*60*60*24-1)",
                },
              ],
            ])
          ),
        }),
      ],
      statementList: [],
    };
    const codeAsString = generateCodeAsString(code, "TypeScript");
    console.log(codeAsString);
    expect(codeAsString).toMatch(/日にちの中のミリ秒. 0 to 86399999/u);
  });
});

it("output lambda type parameter", () => {
  const typeParameterIdentifer = identifer.fromString("t");
  const code: data.Code = {
    exportDefinitionList: [],
    statementList: [
      data.statementVariableDefinition(
        identifer.fromString("sampleFunction"),
        data.typeFunction(
          [typeParameterIdentifer],
          [data.typeScopeInFile(typeParameterIdentifer)],
          data.typeObject(
            new Map([
              [
                "value",
                {
                  required: true,
                  document: "",
                  type: data.typeScopeInFile(typeParameterIdentifer),
                },
              ],
              [
                "s",
                {
                  required: true,
                  document: "",
                  type: data.typeWithParameter(
                    Type.ImportedType(
                      "sampleModule",
                      identifer.fromString("Type")
                    ),
                    [Type.Number]
                  ),
                },
              ],
            ])
          )
        ),
        data.lambda(
          [
            {
              name: identifer.fromString("input"),
              type: data.typeScopeInFile(typeParameterIdentifer),
            },
          ],
          [typeParameterIdentifer],
          data.typeObject(
            new Map([
              [
                "value",
                {
                  required: true,
                  document: "",
                  type: data.typeScopeInFile(typeParameterIdentifer),
                },
              ],
            ])
          ),
          [
            Statement.Return(
              data.objectLiteral([
                data.memberKeyValue(
                  "value",
                  Expr.Variable(identifer.fromString("input"))
                ),
              ])
            ),
          ]
        )
      ),
    ],
  };
  const codeAsString = generateCodeAsString(code, "TypeScript");
  console.log(codeAsString);
  expect(codeAsString).toMatch(
    /<t extends unknown>\(input: t\): \{ readonly value: t \} =>/u
  );
});

it("output optional type member", () => {
  const code: data.Code = {
    exportDefinitionList: [
      ExportDefinition.Variable({
        name: identifer.fromString("value"),
        document: "年齢があってもなくてもいいやつ",
        type: data.typeObject(
          new Map([
            ["name", { required: true, document: "名前", type: Type.String }],
            [
              "age",
              {
                required: false,
                document: "年齢",
                type: Type.Number,
              },
            ],
          ])
        ),
        expr: data.objectLiteral([
          data.memberKeyValue("name", Expr.StringLiteral("narumincho")),
        ]),
      }),
    ],
    statementList: [],
  };
  const codeAsString = generateCodeAsString(code, "TypeScript");
  console.log(codeAsString);
  expect(codeAsString).toMatch(/readonly age\?: number/u);
});
