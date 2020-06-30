import * as customType from "./customType";
import * as name from "./name";
import {
  CustomTypeDefinition,
  CustomTypeDefinitionBody,
  Maybe,
  Type,
} from "@narumincho/type/source/data";

export const customTypeDefinitionList: ReadonlyArray<CustomTypeDefinition> = [
  {
    name: name.codeType,
    description: "出力するコードの種類",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Sum([
      {
        name: "JavaScript",
        description: "JavaScript",
        parameter: Maybe.Nothing(),
      },
      {
        name: "TypeScript",
        description: "TypeScript",
        parameter: Maybe.Nothing(),
      },
    ]),
  },
  {
    name: name.code,
    description:
      "TypeScriptやJavaScriptのコードを表現する. TypeScriptでも出力できるように型情報をつける必要がある",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Product([
      {
        name: "exportDefinitionList",
        description: "外部に公開する定義",
        type: Type.List(customType.exportDefinition),
      },
      {
        name: "statementList",
        description: "定義した後に実行するコード",
        type: Type.List(customType.statement),
      },
    ]),
  },
  {
    name: name.exportDefinition,
    description: "外部に公開する定義",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Sum([
      {
        name: "TypeAlias",
        description: "TypeAlias. `export type T = {}`",
        parameter: Maybe.Just(customType.typeAlias),
      },
      {
        name: "Function",
        description: "Function `export const f = () => {}`",
        parameter: Maybe.Just(customType.function_),
      },
      {
        name: "Variable",
        description: "Variable `export const v = {}`",
        parameter: Maybe.Just(customType.variable),
      },
    ]),
  },
  {
    name: name.typeAlias,
    description: "TypeAlias. `export type T = {}`",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Product([
      {
        name: "name",
        description: "型の名前",
        type: customType.identifer,
      },
      {
        name: "typeParameterList",
        description: "型パラメーターのリスト",
        type: Type.List(customType.identifer),
      },
      {
        name: "document",
        description: "ドキュメント",
        type: Type.String,
      },
      {
        name: "type",
        description: "型本体",
        type: customType.type,
      },
    ]),
  },
  {
    name: name.function_,
    description: "",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Product([
      {
        name: "name",
        description: "外部に公開する関数の名前",
        type: customType.identifer,
      },
      {
        name: "document",
        description: "ドキュメント",
        type: Type.String,
      },
      {
        name: "typeParameterList",
        description: "型パラメーターのリスト",
        type: Type.List(customType.identifer),
      },
      {
        name: "parameterList",
        description: "パラメーター",
        type: Type.List(customType.parameterWithDocument),
      },
      {
        name: "returnType",
        description: "戻り値の型",
        type: customType.type,
      },
      {
        name: "statementList",
        description: "関数の本体",
        type: customType.statement,
      },
    ]),
  },
  {
    name: name.parameterWithDocument,
    description:
      "ドキュメント付きの関数のパラメーター. パラメーター名, ドキュメント, 型",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Product([
      {
        name: "name",
        description: "パラメーター名",
        type: customType.identifer,
      },
      {
        name: "document",
        description: "ドキュメント",
        type: Type.String,
      },
      {
        name: "type",
        description: "パラメーターの型",
        type: customType.type,
      },
    ]),
  },
  {
    name: name.parameter,
    description: "関数のパラメーター. パラメーター名, ドキュメント",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Product([
      {
        name: "name",
        description: "パラメーター名",
        type: customType.identifer,
      },
      {
        name: "type",
        description: "パラメーターの型",
        type: customType.type,
      },
    ]),
  },
  {
    name: name.variable,
    description: "",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Product([
      {
        name: "name",
        description: "変数の名前",
        type: customType.identifer,
      },
      {
        name: "document",
        description: "ドキュメント",
        type: Type.String,
      },
      {
        name: "type",
        description: "変数の型",
        type: customType.type,
      },
      {
        name: "expr",
        description: "変数の式",
        type: customType.expr,
      },
    ]),
  },
  {
    name: name.unaryOperator,
    description: "単項演算子",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Sum([
      {
        name: "Minus",
        description: "単項マイナス演算子 `-a`",
        parameter: Maybe.Nothing(),
      },
      {
        name: "BitwiseNot",
        description: "ビット否定 `~a`",
        parameter: Maybe.Nothing(),
      },
      {
        name: "LogicalNot",
        description: "論理否定 `!a`",
        parameter: Maybe.Nothing(),
      },
    ]),
  },
  {
    name: name.binaryOperator,
    description: "2項演算子",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Sum([
      {
        name: "Exponentiation",
        description: "べき乗 `a ** b",
        parameter: Maybe.Nothing(),
      },
      {
        name: "Multiplication",
        description: "数値の掛け算 `a * b",
        parameter: Maybe.Nothing(),
      },
      {
        name: "Division",
        description: "数値の割り算 `a / b`",
        parameter: Maybe.Nothing(),
      },
      {
        name: "Remainder",
        description: "剰余演算 `a % b`",
        parameter: Maybe.Nothing(),
      },
      {
        name: "Addition",
        description: "数値の足し算, 文字列の結合 `a + b`",
        parameter: Maybe.Nothing(),
      },
      {
        name: "Subtraction",
        description: "数値の引き算 `a - b`",
        parameter: Maybe.Nothing(),
      },
      {
        name: "LeftShift",
        description: "左シフト `a << b`",
        parameter: Maybe.Nothing(),
      },
      {
        name: "SignedRightShift",
        description: "符号を維持する右シフト `a >> b`",
        parameter: Maybe.Nothing(),
      },
      {
        name: "UnsignedRightShift",
        description: "符号を維持しない(0埋め)右シフト `a >>> b`",
        parameter: Maybe.Nothing(),
      },
      {
        name: "LessThan",
        description: "未満 `a < b`",
        parameter: Maybe.Nothing(),
      },
      {
        name: "LessThanOrEqual",
        description: "以下 `a <= b`",
        parameter: Maybe.Nothing(),
      },
      {
        name: "Equal",
        description: "等号 `a === b`",
        parameter: Maybe.Nothing(),
      },
      {
        name: "NotEqual",
        description: "不等号 `a !== b`",
        parameter: Maybe.Nothing(),
      },
      {
        name: "BitwiseAnd",
        description: "ビットAND `a & b`",
        parameter: Maybe.Nothing(),
      },
      {
        name: "BitwiseXOr",
        description: "ビットXOR `a ^ b`",
        parameter: Maybe.Nothing(),
      },
      {
        name: "BitwiseOr",
        description: "ビットOR `a | b`",
        parameter: Maybe.Nothing(),
      },
      {
        name: "LogicalAnd",
        description: "論理AND `a && b`",
        parameter: Maybe.Nothing(),
      },
      {
        name: "LogicalOr",
        description: "論理OR `a || b`",
        parameter: Maybe.Nothing(),
      },
    ]),
  },
  {
    name: name.expr,
    description: "式",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Sum([
      {
        name: "NumberLiteral",
        description: "数値リテラル `123`",
        parameter: Maybe.Just(Type.Int32),
      },
      {
        name: "StringLiteral",
        description: '文字列リテラル `"text"`',
        parameter: Maybe.Just(Type.String),
      },
      {
        name: "BooleanLiteral",
        description: "booleanリテラル",
        parameter: Maybe.Just(Type.Bool),
      },
      {
        name: "NullLiteral",
        description: "`null`",
        parameter: Maybe.Nothing(),
      },
      {
        name: "UndefinedLiteral",
        description: "`undefined`",
        parameter: Maybe.Nothing(),
      },
      {
        name: "UnaryOperator",
        description: "単項演算子での式",
        parameter: Maybe.Just(customType.unaryOperatorExpr),
      },
      {
        name: "BinaryOperator",
        description: "2項演算子での式",
        parameter: Maybe.Just(customType.binaryOperatorExpr),
      },
      {
        name: "ConditionalOperator",
        description: "条件演算子 `a ? b : c`",
        parameter: Maybe.Just(customType.conditionalOperatorExpr),
      },
      {
        name: "ArrayLiteral",
        description: "配列リテラル `[1, 2, 3]`",
        parameter: Maybe.Just(Type.List(customType.arrayItem)),
      },
      {
        name: "ObjectLiteral",
        description: 'オブジェクトリテラル `{ data: 123, text: "sorena" }`',
        parameter: Maybe.Just(Type.List(customType.member)),
      },
      {
        name: "Lambda",
        description: "ラムダ式 `() => {}`",
        parameter: Maybe.Just(customType.lambdaExpr),
      },
      {
        name: "Variable",
        description: "変数. 変数が存在するかのチャックがされる",
        parameter: Maybe.Just(customType.identifer),
      },
      {
        name: "GlobalObjects",
        description: "グローバルオブジェクト",
        parameter: Maybe.Just(customType.identifer),
      },
      {
        name: "ImportedVariable",
        description: "インポートされた変数",
        parameter: Maybe.Just(customType.importedVariable),
      },
      {
        name: "Get",
        description: "プロパティの値を取得する `a.b a[12] data[f(2)]`",
        parameter: Maybe.Just(customType.getExpr),
      },
      {
        name: "Call",
        description: "関数を呼ぶ f(x)",
        parameter: Maybe.Just(customType.callExpr),
      },
      {
        name: "New",
        description: "式からインスタンスを作成する `new Date()`",
        parameter: Maybe.Just(customType.callExpr),
      },
      {
        name: "TypeAssertion",
        description: "型アサーション `a as string`",
        parameter: Maybe.Just(customType.TypeAssertion),
      },
    ]),
  },
  {
    name: name.statement,
    description: "",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Sum([
      {
        name: "EvaluateExpr",
        description: "",
        parameter: Maybe.Just(customType.expr),
      },
      {
        name: "Set",
        description: "",
        parameter: Maybe.Just(customType.setStatement),
      },
      {
        name: "If",
        description: "",
        parameter: Maybe.Just(customType.ifStatement),
      },
      {
        name: "ThrowError",
        description: "",
        parameter: Maybe.Just(customType.expr),
      },
      {
        name: "Return",
        description: "",
        parameter: Maybe.Just(customType.expr),
      },
      {
        name: "ReturnVoid",
        description: "",
        parameter: Maybe.Nothing(),
      },
      {
        name: "Continue",
        description: "",
        parameter: Maybe.Nothing(),
      },
      {
        name: "VariableDefinition",
        description: "",
        parameter: Maybe.Just(customType.variableDefinitionStatement),
      },
      {
        name: "For",
        description: "",
        parameter: Maybe.Just(customType.forStatement),
      },
      {
        name: "ForOf",
        description: "",
        parameter: Maybe.Just(customType.forOfStatement),
      },
      {
        name: "WhileTrue",
        description: "",
        parameter: Maybe.Just(Type.List(customType.statement)),
      },
      {
        name: "Break",
        description: "",
        parameter: Maybe.Nothing(),
      },
      {
        name: "Switch",
        description: "",
        parameter: Maybe.Just(customType.switchStatement),
      },
    ]),
  },
  {
    name: name.identifer,
    description: "TypeScriptの識別子として使える文字",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Sum([
      {
        name: "Identifer",
        description:
          '**直接 Identifer.Identifer("name") と指定してはいけない!! TypeScriptの識別子として使える文字としてチェックできないため**',
        parameter: Maybe.Just(Type.String),
      },
    ]),
  },
];
