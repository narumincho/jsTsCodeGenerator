import * as customType from "./type";
import * as name from "./typePartId";
import * as definyCoreData from "definy-core/source/data";

const sum = (
  typeName: string,
  description: string,
  patternList: ReadonlyArray<Pattern>
): CustomTypeDefinition => ({
  name: typeName,
  description,
  typeParameterList: [],
  body: CustomTypeDefinitionBody.Sum(patternList),
});

const product = (
  typeName: string,
  description: string,
  memberList: ReadonlyArray<Member>
): CustomTypeDefinition => ({
  name: typeName,
  description,
  typeParameterList: [],
  body: CustomTypeDefinitionBody.Product(memberList),
});

export const customTypeDefinitionList: ReadonlyArray<CustomTypeDefinition> = [
  sum(name.codeType, "出力するコードの種類", [
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
  product(
    name.code,
    "TypeScriptやJavaScriptのコードを表現する. TypeScriptでも出力できるように型情報をつける必要がある",
    [
      {
        name: "exportDefinitionList",
        description: "外部に公開する定義",
        type: Type.List(customType.ExportDefinition),
      },
      {
        name: "statementList",
        description: "定義した後に実行するコード",
        type: Type.List(customType.Statement),
      },
    ]
  ),
  sum(name.exportDefinition, "外部に公開する定義", [
    {
      name: "TypeAlias",
      description: "TypeAlias. `export type T = {}`",
      parameter: Maybe.Just(customType.TypeAlias),
    },
    {
      name: "Function",
      description: "Function `export const f = () => {}`",
      parameter: Maybe.Just(customType.Function_),
    },
    {
      name: "Variable",
      description: "Variable `export const v = {}`",
      parameter: Maybe.Just(customType.Variable),
    },
  ]),
  product(name.typeAlias, "TypeAlias. `export type T = {}`", [
    {
      name: "name",
      description: "型の名前",
      type: customType.Identifer,
    },
    {
      name: "typeParameterList",
      description: "型パラメーターのリスト",
      type: Type.List(customType.Identifer),
    },
    {
      name: "document",
      description: "ドキュメント",
      type: Type.String,
    },
    {
      name: "type",
      description: "型本体",
      type: customType.Type,
    },
  ]),
  product(name.function_, "", [
    {
      name: "name",
      description: "外部に公開する関数の名前",
      type: customType.Identifer,
    },
    {
      name: "document",
      description: "ドキュメント",
      type: Type.String,
    },
    {
      name: "typeParameterList",
      description: "型パラメーターのリスト",
      type: Type.List(customType.Identifer),
    },
    {
      name: "parameterList",
      description: "パラメーター",
      type: Type.List(customType.ParameterWithDocument),
    },
    {
      name: "returnType",
      description: "戻り値の型",
      type: customType.Type,
    },
    {
      name: "statementList",
      description: "関数の本体",
      type: Type.List(customType.Statement),
    },
  ]),
  {
    name: name.parameterWithDocument,
    description:
      "ドキュメント付きの関数のパラメーター. パラメーター名, ドキュメント, 型",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Product([
      {
        name: "name",
        description: "パラメーター名",
        type: customType.Identifer,
      },
      {
        name: "document",
        description: "ドキュメント",
        type: Type.String,
      },
      {
        name: "type",
        description: "パラメーターの型",
        type: customType.Type,
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
        type: customType.Identifer,
      },
      {
        name: "type",
        description: "パラメーターの型",
        type: customType.Type,
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
        type: customType.Identifer,
      },
      {
        name: "document",
        description: "ドキュメント",
        type: Type.String,
      },
      {
        name: "type",
        description: "変数の型",
        type: customType.Type,
      },
      {
        name: "expr",
        description: "変数の式",
        type: customType.Expr,
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
        parameter: Maybe.Just(customType.UnaryOperatorExpr),
      },
      {
        name: "BinaryOperator",
        description: "2項演算子での式",
        parameter: Maybe.Just(customType.BinaryOperatorExpr),
      },
      {
        name: "ConditionalOperator",
        description: "条件演算子 `a ? b : c`",
        parameter: Maybe.Just(customType.ConditionalOperatorExpr),
      },
      {
        name: "ArrayLiteral",
        description: "配列リテラル `[1, 2, 3]`",
        parameter: Maybe.Just(Type.List(customType.ArrayItem)),
      },
      {
        name: "ObjectLiteral",
        description: 'オブジェクトリテラル `{ data: 123, text: "sorena" }`',
        parameter: Maybe.Just(Type.List(customType.Member)),
      },
      {
        name: "Lambda",
        description: "ラムダ式 `() => {}`",
        parameter: Maybe.Just(customType.LambdaExpr),
      },
      {
        name: "Variable",
        description: "変数. 変数が存在するかのチャックがされる",
        parameter: Maybe.Just(customType.Identifer),
      },
      {
        name: "GlobalObjects",
        description: "グローバルオブジェクト",
        parameter: Maybe.Just(customType.Identifer),
      },
      {
        name: "ImportedVariable",
        description: "インポートされた変数",
        parameter: Maybe.Just(customType.ImportedVariable),
      },
      {
        name: "Get",
        description: "プロパティの値を取得する `a.b a[12] data[f(2)]`",
        parameter: Maybe.Just(customType.GetExpr),
      },
      {
        name: "Call",
        description: "関数を呼ぶ f(x)",
        parameter: Maybe.Just(customType.CallExpr),
      },
      {
        name: "New",
        description: "式からインスタンスを作成する `new Date()`",
        parameter: Maybe.Just(customType.CallExpr),
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
        description: "expr;\n式を評価する",
        parameter: Maybe.Just(customType.Expr),
      },
      {
        name: "Set",
        description:
          '```ts\ntargetObject[targetPropertyName] = expr;\nlocation.href = "https://narumincho.com";\narray[0] = 30;\ndata = 50;\ni += 1;\n```\n代入やプロパティの値を設定する。',
        parameter: Maybe.Just(customType.SetStatement),
      },
      {
        name: "If",
        description: "if (condition) { thenStatementList }",
        parameter: Maybe.Just(customType.IfStatement),
      },
      {
        name: "ThrowError",
        description: 'throw new Error("エラーメッセージ");',
        parameter: Maybe.Just(customType.Expr),
      },
      {
        name: "Return",
        description: "return expr;",
        parameter: Maybe.Just(customType.Expr),
      },
      {
        name: "ReturnVoid",
        description: "return;\n戻り値がvoidの関数を早く抜ける",
        parameter: Maybe.Nothing(),
      },
      {
        name: "Continue",
        description: "continue;\nforの繰り返しを次に進める",
        parameter: Maybe.Nothing(),
      },
      {
        name: "VariableDefinition",
        description: "`const a: type_ = expr`\nローカル変数の定義",
        parameter: Maybe.Just(customType.VariableDefinitionStatement),
      },
      {
        name: "FunctionDefinition",
        description:
          "`const name = (parameterList): returnType => { statementList }`\nローカル関数の定義",
        parameter: Maybe.Just(customType.FunctionDefinitionStatement),
      },
      {
        name: "For",
        description:
          "```ts\nfor (let counterVariableName = 0; counterVariableName < untilExpr; counterVariableName += 1) {\n  statementList\n}\n```",
        parameter: Maybe.Just(customType.ForStatement),
      },
      {
        name: "ForOf",
        description:
          "```ts\nfor (const elementVariableName of iterableExpr) {\n  statementList\n}\n```",
        parameter: Maybe.Just(customType.ForOfStatement),
      },
      {
        name: "WhileTrue",
        description: "while (true) { statementList }",
        parameter: Maybe.Just(Type.List(customType.Statement)),
      },
      {
        name: "Break",
        description: "whileのループから抜ける",
        parameter: Maybe.Nothing(),
      },
      {
        name: "Switch",
        description: "switch文",
        parameter: Maybe.Just(customType.SwitchStatement),
      },
    ]),
  },
  {
    name: name.type,
    description: "型",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Sum([
      {
        name: "Number",
        description: "プリミティブの型のnumber",
        parameter: Maybe.Nothing(),
      },
      {
        name: "String",
        description: "プリミティブの型のstring",
        parameter: Maybe.Nothing(),
      },
      {
        name: "Boolean",
        description: "プリミティブの型のboolean",
        parameter: Maybe.Nothing(),
      },
      {
        name: "Undefined",
        description: "プリミティブの型のundefined",
        parameter: Maybe.Nothing(),
      },
      {
        name: "Null",
        description: "プリミティブの型のnull",
        parameter: Maybe.Nothing(),
      },
      {
        name: "Never",
        description: "never型",
        parameter: Maybe.Nothing(),
      },
      {
        name: "Void",
        description: "void型",
        parameter: Maybe.Nothing(),
      },
      {
        name: "Object",
        description: "オブジェクト",
        parameter: Maybe.Just(Type.List(customType.MemberType)),
      },
      {
        name: "Function",
        description: "関数 `(parameter: parameter) => returnType`",
        parameter: Maybe.Just(customType.FunctionType),
      },
      {
        name: "WithTypeParameter",
        description:
          "型パラメータ付きの型 `Promise<number>` `ReadonlyArray<string>`",
        parameter: Maybe.Just(customType.TypeWithTypeParameter),
      },
      {
        name: "Union",
        description: "ユニオン型 `a | b`",
        parameter: Maybe.Just(Type.List(customType.Type)),
      },
      {
        name: "Intersection",
        description: "交差型 `left & right`",
        parameter: Maybe.Just(customType.IntersectionType),
      },
      {
        name: "ImportedType",
        description: "インポートされた外部の型",
        parameter: Maybe.Just(customType.ImportedType),
      },
      {
        name: "ScopeInFile",
        description: "ファイル内で定義された型",
        parameter: Maybe.Just(customType.Identifer),
      },
      {
        name: "ScopeInGlobal",
        description: "グローバル空間の型",
        parameter: Maybe.Just(customType.Identifer),
      },
      {
        name: "StringLiteral",
        description: "文字列リテラル型",
        parameter: Maybe.Just(Type.String),
      },
    ]),
  },
  {
    name: name.unaryOperatorExpr,
    description: "単項演算子と適用される式",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Product([
      {
        name: "operator",
        description: "単項演算子",
        type: customType.UnaryOperator,
      },
      {
        name: "expr",
        description: "適用される式",
        type: customType.Expr,
      },
    ]),
  },
  {
    name: name.binaryOperatorExpr,
    description: "2項演算子と左右の式",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Product([
      {
        name: "operator",
        description: "2項演算子",
        type: customType.BinaryOperator,
      },
      {
        name: "left",
        description: "左の式",
        type: customType.Expr,
      },
      {
        name: "right",
        description: "右の式",
        type: customType.Expr,
      },
    ]),
  },
  {
    name: name.conditionalOperatorExpr,
    description: "条件演算子",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Product([
      {
        name: "condition",
        description: "条件の式",
        type: customType.Expr,
      },
      {
        name: "thenExpr",
        description: "条件がtrueのときに評価される式",
        type: customType.Expr,
      },
      {
        name: "elseExpr",
        description: "条件がfalseのときに評価される式",
        type: customType.Expr,
      },
    ]),
  },
  {
    name: name.arrayItem,
    description: "配列リテラルの要素",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Product([
      {
        name: "expr",
        description: "式",
        type: customType.Expr,
      },
      {
        name: "spread",
        description: "スプレッド ...a のようにするか",
        type: Type.Bool,
      },
    ]),
  },
  {
    name: name.member,
    description: "オブジェクトリテラルの要素",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Sum([
      {
        name: "Spread",
        description: "...a のようにする",
        parameter: Maybe.Just(customType.Expr),
      },
      {
        name: "KeyValue",
        description: "a: b のようにする",
        parameter: Maybe.Just(customType.KeyValue),
      },
    ]),
  },
  {
    name: name.keyValue,
    description: "文字列のkeyと式のvalue",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Product([
      {
        name: "key",
        description: "key",
        type: Type.String,
      },
      {
        name: "value",
        description: "value",
        type: customType.Expr,
      },
    ]),
  },
  {
    name: name.lambdaExpr,
    description: "ラムダ式",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Product([
      {
        name: "parameterList",
        description: "パラメーターのリスト",
        type: Type.List(customType.Parameter),
      },
      {
        name: "typeParameterList",
        description: "型パラメーターのリスト",
        type: Type.List(customType.Identifer),
      },
      {
        name: "returnType",
        description: "戻り値の型",
        type: customType.Type,
      },
      {
        name: "statementList",
        description: "ラムダ式本体",
        type: Type.List(customType.Statement),
      },
    ]),
  },
  {
    name: name.importedVariable,
    description: "インポートした変数",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Product([
      {
        name: "moduleName",
        description:
          "モジュール名, 使うときにはnamedインポートされ, そのモジュール識別子は自動的につけられる",
        type: Type.String,
      },
      {
        name: "name",
        description: "変数名",
        type: customType.Identifer,
      },
    ]),
  },
  {
    name: name.getExpr,
    description: "プロパティアクセス",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Product([
      {
        name: "expr",
        description: "式",
        type: customType.Expr,
      },
      {
        name: "propertyExpr",
        description: "プロパティの式",
        type: customType.Expr,
      },
    ]),
  },
  {
    name: name.callExpr,
    description: "式と呼ぶパラメーター",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Product([
      {
        name: "expr",
        description: "呼ばれる式",
        type: customType.Expr,
      },
      {
        name: "parameterList",
        description: "パラメーター",
        type: Type.List(customType.Expr),
      },
    ]),
  },
  {
    name: name.typeAssertion,
    description: "型アサーション",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Product([
      {
        name: "expr",
        description: "型アサーションを受ける式",
        type: customType.Expr,
      },
      {
        name: "type",
        description: "型",
        type: customType.Type,
      },
    ]),
  },
  product(name.setStatement, "代入文", [
    {
      name: "target",
      description: "対象となる式. 指定の仕方によってはJSのSyntaxErrorになる",
      type: customType.Expr,
    },
    {
      name: "operatorMaybe",
      description: "演算子を=の左につける",
      type: Type.Maybe(customType.BinaryOperator),
    },
    {
      name: "expr",
      description: "式",
      type: customType.Expr,
    },
  ]),
  product(name.ifStatement, "if文", [
    {
      name: "condition",
      description: "条件の式",
      type: customType.Expr,
    },
    {
      name: "thenStatementList",
      description: "条件がtrueのときに実行する文",
      type: Type.List(customType.Statement),
    },
  ]),
  product(name.variableDefinitionStatement, "ローカル変数定義", [
    {
      name: "name",
      description: "変数名",
      type: customType.Identifer,
    },
    {
      name: "type",
      description: "変数の型",
      type: customType.Type,
    },
    {
      name: "expr",
      description: "式",
      type: customType.Expr,
    },
    {
      name: "isConst",
      description: "constかどうか. falseはlet",
      type: Type.Bool,
    },
  ]),
  product(name.functionDefinitionStatement, "ローカル関数定義", [
    {
      name: "name",
      description: "変数名",
      type: customType.Identifer,
    },
    {
      name: "typeParameterList",
      description: "型パラメーターのリスト",
      type: Type.List(customType.Identifer),
    },
    {
      name: "parameterList",
      description: "パラメーターのリスト",
      type: Type.List(customType.ParameterWithDocument),
    },
    {
      name: "returnType",
      description: "戻り値の型",
      type: customType.Type,
    },
    {
      name: "statementList",
      description: "関数本体",
      type: Type.List(customType.Statement),
    },
  ]),
  product(name.forStatement, "for文", [
    {
      name: "counterVariableName",
      description: "カウンタ変数名",
      type: customType.Identifer,
    },
    {
      name: "untilExpr",
      description: "ループの上限の式",
      type: customType.Expr,
    },
    {
      name: "statementList",
      description: "繰り返す文",
      type: Type.List(customType.Statement),
    },
  ]),
  product(name.forOfStatement, "forOf文", [
    {
      name: "elementVariableName",
      description: "要素の変数名",
      type: customType.Identifer,
    },
    {
      name: "iterableExpr",
      description: "繰り返す対象",
      type: customType.Expr,
    },
    {
      name: "statementList",
      description: "繰り返す文",
      type: Type.List(customType.Statement),
    },
  ]),
  product(name.switchStatement, "switch文", [
    {
      name: "expr",
      description: "switch(a) {} の a",
      type: customType.Expr,
    },
    {
      name: "patternList",
      description: 'case "text": { statementList }',
      type: Type.List(customType.Pattern),
    },
  ]),
  product(name.pattern, 'switch文のcase "text": { statementList } の部分', [
    {
      name: "caseString",
      description: "case に使う文字列",
      type: Type.String,
    },
    {
      name: "statementList",
      description: "statementList",
      type: Type.List(customType.Statement),
    },
  ]),
  product(name.memberType, "オブジェクトのメンバーの型", [
    {
      name: "name",
      description: "プロパティ名",
      type: Type.String,
    },
    {
      name: "required",
      description: "必須かどうか falseの場合 ? がつく",
      type: Type.Bool,
    },
    {
      name: "type",
      description: "型",
      type: customType.Type,
    },
    {
      name: "document",
      description: "ドキュメント",
      type: Type.String,
    },
  ]),
  product(name.functionType, "関数の型", [
    {
      name: "typeParameterList",
      description: "型パラメーターのリスト",
      type: Type.List(customType.Identifer),
    },
    {
      name: "parameterList",
      description: "パラメーターの型. 意味のない引数名は適当に付く",
      type: Type.List(customType.Type),
    },
    {
      name: "return",
      description: "戻り値の型",
      type: customType.Type,
    },
  ]),
  product(name.typeWithTypeParameter, "パラメーター付きの型", [
    {
      name: "type",
      description: "パラメーターをつけられる型",
      type: customType.Type,
    },
    {
      name: "typeParameterList",
      description:
        "パラメーターに指定する型. なにも要素を入れなけければ T<>ではなく T の形式で出力される",
      type: Type.List(customType.Type),
    },
  ]),
  product(name.intersectionType, "交差型", [
    {
      name: "left",
      description: "左に指定する型",
      type: customType.Type,
    },
    {
      name: "right",
      description: "右に指定する型",
      type: customType.Type,
    },
  ]),
  product(name.importedType, "インポートされた型", [
    {
      name: "moduleName",
      description:
        "モジュール名. namedImportされるがその識別子は自動的に作成される",
      type: Type.String,
    },
    {
      name: "name",
      description: "型の名前",
      type: customType.Identifer,
    },
  ]),
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
