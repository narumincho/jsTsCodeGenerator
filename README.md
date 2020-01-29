# js-ts-code-generator

[![npm version](https://badge.fury.io/js/js-ts-code-generator.svg)](https://badge.fury.io/js/js-ts-code-generator)
[![NPM](https://nodei.co/npm/js-ts-code-generator.png)](https://nodei.co/npm/js-ts-code-generator/)

## コンセプト

[Definy](https://github.com/narumincho/Definy) や [call-on-http](https://github.com/narumincho/call-on-http) で TypeScript, JavaScript のコードを生成したかったので作った。

- 外部に公開する部分の名前、ドキュメント、構造は維持する
- 外部に公開しない部分の名前、ドキュメント、構造は維持しない
- 入力値は、外部に公開しない(変数,関数)の(名前,ドキュメント,構造)は持たないので TypeScript の AST(抽象構文木)とは違う
- 出力した形式は人間には読みづらい
- コードのサイズが小さくなるように minify される
- Node.js でもブラウザでも動く
- 入力のコードにはある程度の制限がかかる (全てには対応しない)

## どのレベルまでやるか処理

- 内部の(変数名、引数名)を自動で名前を決める
- 外部に公開する(関数名、引数名)、オブジェクトのキーは変更しない
- JavaScript 文法系統のものをここで処理する
- JavaScript の Built in Object 等はここで持たない

## 対応する形式

- Node.js 向けの TypeScript (call-on-http)
- ブラウザ向けの TypeScript (call-on-http, Definy)
- ブラウザ向けの JavaScript (Definy の基本のコンパイルターゲット)
- 両対応の JavaScript+d.ts (Definy の npm パッケージとして公開する機能)

## npm へリリースするときは master ブランチに Release 0.0.1 のようなコミットメッセージをつければリリースされる
