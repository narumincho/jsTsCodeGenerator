# js-ts-code-generator

[![npm version](https://badge.fury.io/js/js-ts-code-generator.svg)](https://badge.fury.io/js/js-ts-code-generator)
[![NPM](https://nodei.co/npm/js-ts-code-generator.png)](https://nodei.co/npm/js-ts-code-generator/)

## コンセプト

[Definy](https://github.com/narumincho/Definy) や [call-on-http](https://github.com/narumincho/call-on-http) で TypeScript, JavaScript のコードを生成したかったので作った。

- 入力値は, 構造化されているので TypeScript の AST(抽象構文木)とは違う
- 出力した形式は人間にも読みやすい
- Node.js でもブラウザでも動く
- 入力のコードにはある程度の制限がかかる (全てには対応しない)

## sample code サンプルコード

```ts
const serverCode: data.Code = {
  exportDefinitionList: [
    data.definitionFunction({
      name: identifer.fromString("middleware"),
      document: "ミドルウェア",
      typeParameterList: [],
      parameterList: [
        {
          name: identifer.fromString("request"),
          document: "リクエスト",
          type_: data.typeImported("express", identifer.fromString("Request"))
        },
        {
          name: identifer.fromString("response"),
          document: "レスポンス",
          type_: data.typeImported("express", identifer.fromString("Response"))
        }
      ],
      returnType: data.typeVoid,
      statementList: [
        data.statementVariableDefinition(
          identifer.fromString("accept"),
          data.typeUnion([data.typeString, data.typeUndefined]),
          data.get(
            data.get(data.variable(identifer.fromString("request")), "headers"),
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
const codeAsString = generator.generateCodeAsString(serverCode, "TypeScript");
console.log(codeAsString);
```

### 出力 output

```ts
import * as a from "express";
/**
 * ミドルウェア
 * @param request リクエスト
 * @param response レスポンス
 *
 */
export const middleware = (request: a.Request, response: a.Response): void => {
  const accept: string | undefined = request.headers.accept;
  if (accept !== undefined && accept.includes("text/html")) {
    response.setHeader("content-type", "text/html");
  }
};
```

## 対応する形式

- Node.js 向けの TypeScript (call-on-http)
- ブラウザ向けの TypeScript (call-on-http, Definy)
- ブラウザ向けの JavaScript (Definy の基本のコンパイルターゲット)
- 両対応の JavaScript+d.ts (Definy の npm パッケージとして公開する機能)

## npm へリリースするときは master ブランチに Release 0.0.1 のようなコミットメッセージをつければリリースされる
