import { data, generateCodeAsString, identifer } from "../source/main";

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
      data.ExportDefinition.Function({
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
        returnType: data.typeVoid,
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
          data.ExportDefinition.Function({
            name: identifer.fromString("new"),
            document: "newという名前の関数",
            typeParameterList: [],
            parameterList: [],
            returnType: data.typeVoid,
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
          data.ExportDefinition.Function({
            name: identifer.fromString("0name"),
            document: "0から始まる識別子",
            typeParameterList: [],
            parameterList: [],
            returnType: data.typeVoid,
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
        data.ExportDefinition.Variable({
          name: identifer.fromString("stringValue"),
          document: "文字列リテラルでエスケープしているか調べる",
          type: data.typeString,
          expr: data.stringLiteral(`

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
    const nodeJsCode: data.Code = {
      exportDefinitionList: [
        data.ExportDefinition.Function({
          name: identifer.fromString("middleware"),
          document: "ミドルウェア",
          typeParameterList: [],
          parameterList: [
            {
              name: identifer.fromString("request"),
              document: "リクエスト",
              type: data.typeImported(
                "express",
                identifer.fromString("Request")
              ),
            },
            {
              name: identifer.fromString("response"),
              document: "レスポンス",
              type: data.typeImported(
                "express",
                identifer.fromString("Response")
              ),
            },
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
                      data.stringLiteral("text/html"),
                    ]
                  )
                ),
              ]
            ),
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
          data.ExportDefinition.Function({
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
            returnType: data.typeNumber,
            statementList: [
              data.statementReturn(
                data.getByExpr(
                  data.variable(identifer.fromString("array")),
                  data.numberLiteral(0)
                )
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
        data.statementLetVariableDefinition(
          identifer.fromString("sorena"),
          data.typeString,
          data.stringLiteral("それな")
        ),
        data.consoleLog(data.variable(identifer.fromString("sorena"))),
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
          data.ExportDefinition.Function({
            name: identifer.fromString("sample"),
            document: "",
            typeParameterList: [],
            parameterList: [],
            returnType: data.promiseType(data.typeString),
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
          data.statementEvaluateExpr(
            data.objectLiteral([
              data.memberKeyValue("abc", data.numberLiteral(3)),
              data.memberKeyValue("a b c", data.stringLiteral("separated")),
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
          data.ExportDefinition.Function({
            name: identifer.fromString("returnObject"),
            document: "",
            typeParameterList: [],
            parameterList: [],
            returnType: data.typeObject(
              new Map([
                ["name", { type: data.typeString, document: "" }],
                ["age", { type: data.typeNumber, document: "" }],
              ])
            ),
            statementList: [
              data.statementReturn(
                data.objectLiteral([
                  data.memberKeyValue("name", data.stringLiteral("mac")),
                  data.memberKeyValue("age", data.numberLiteral(10)),
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
            data.typeNumber,
            data.numberLiteral(10)
          ),
          data.statementSet(data.variable(v), null, data.numberLiteral(30)),
          data.statementSet(data.variable(v), "+", data.numberLiteral(1)),
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
            { expr: data.numberLiteral(1), spread: false },
            { expr: data.numberLiteral(2), spread: false },
            {
              expr: data.arrayLiteral([
                { expr: data.numberLiteral(3), spread: false },
                { expr: data.numberLiteral(4), spread: false },
                { expr: data.numberLiteral(5), spread: false },
              ]),
              spread: true,
            },
          ]),
          [data.consoleLog(data.variable(identifer.fromString("element")))]
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
        data.ExportDefinition.TypeAlias({
          name: identifer.fromString("Result"),
          document: "Result型",
          parameterList: [
            identifer.fromString("error"),
            identifer.fromString("ok"),
          ],
          type: data.typeUnion([
            data.typeObject(
              new Map([
                ["_", { type: data.typeStringLiteral("Ok"), document: "" }],
                [
                  "ok",
                  {
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
                  { type: data.typeStringLiteral("Error"), document: "Error" },
                ],
                [
                  "error",
                  {
                    type: data.typeScopeInGlobal(identifer.fromString("error")),
                    document: "",
                  },
                ],
              ])
            ),
          ]),
        }),
        data.ExportDefinition.Function({
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
          returnType: data.typeString,
          statementList: [
            data.statementSwitch({
              expr: data.get(data.variable(identifer.fromString("value")), "_"),
              patternList: [
                {
                  caseTag: "Ok",
                  statementList: [
                    data.statementReturn(
                      data.callMethod(
                        data.get(
                          data.variable(identifer.fromString("value")),
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
                    data.statementReturn(
                      data.callMethod(
                        data.get(
                          data.variable(identifer.fromString("value")),
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
        data.statementEvaluateExpr(
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
        data.ExportDefinition.TypeAlias({
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
              [
                "a",
                {
                  type: data.typeString,
                  document: "",
                },
              ],
              [
                "b",
                {
                  type: data.typeNumber,
                  document: "",
                },
              ],
            ])
          ),
          data.objectLiteral([
            data.memberKeyValue("a", data.stringLiteral("aValue")),
            data.memberKeyValue("b", data.numberLiteral(123)),
          ])
        ),
        data.consoleLog(
          data.objectLiteral([
            data.memberSpread(data.variable(identifer.fromString("value"))),
            data.memberKeyValue("b", data.numberLiteral(987)),
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
        data.ExportDefinition.TypeAlias({
          name: identifer.fromString("Time"),
          document: "初期のDefinyで使う時間の内部表現",
          parameterList: [],
          type: data.typeObject(
            new Map([
              [
                "day",
                {
                  type: data.typeNumber,
                  document:
                    "1970-01-01からの経過日数. マイナスになることもある",
                },
              ],
              [
                "millisecond",
                {
                  type: data.typeNumber,
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
                  document: "",
                  type: data.typeScopeInFile(typeParameterIdentifer),
                },
              ],
              [
                "s",
                {
                  document: "",
                  type: data.typeWithParameter(
                    data.typeImported(
                      "sampleModule",
                      identifer.fromString("Type")
                    ),
                    [data.typeNumber]
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
                  document: "",
                  type: data.typeScopeInFile(typeParameterIdentifer),
                },
              ],
            ])
          ),
          [
            data.statementReturn(
              data.objectLiteral([
                data.memberKeyValue(
                  "value",
                  data.variable(identifer.fromString("input"))
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
