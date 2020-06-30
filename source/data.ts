import * as identifer from "./identifer";
import { Expr, Statement, Type } from "./newData";

/**
 * プロパティの値を取得する。getByExprのシンタックスシュガー
 * @param expr 式
 * @param propertyName プロパティ名
 */
export const get = (expr: Expr, propertyName: string): Expr =>
  Expr.Get({
    expr,
    propertyExpr: Expr.StringLiteral(propertyName),
  });

/**
 * メソッドを呼ぶ (getとcallのシンタックスシュガー)
 * @param expr
 * @param methodName
 * @param parameterList
 */
export const callMethod = (
  expr: Expr,
  methodName: string,
  parameterList: ReadonlyArray<Expr>
): Expr => Expr.Call({ expr: get(expr, methodName), parameterList });

/**
 * ```ts
 * Number.parseInt(parameter)
 * Number.isNaN(parameter)
 * ```
 */
export const callNumberMethod = (
  methodName: string,
  parameterList: ReadonlyArray<Expr>
): Expr =>
  callMethod(
    Expr.GlobalObjects(identifer.fromString("Number")),
    methodName,
    parameterList
  );

/**
 * ```ts
 * Math.floor(parameter)
 * Math.sqrt(parameter)
 * ```
 */
export const callMathMethod = (
  methodName: string,
  parameterList: ReadonlyArray<Expr>
): Expr =>
  callMethod(
    Expr.GlobalObjects(identifer.fromString("Math")),
    methodName,
    parameterList
  );

/**
 * ```ts
 * new Date()
 * ```
 */
export const newDate: Expr = Expr.New({
  expr: Expr.GlobalObjects(identifer.fromString("Date")),
  parameterList: [],
});

/**
 * ```ts
 * new Uint8Array(lengthOrIterable)
 * ```
 */
export const newUint8Array = (lengthOrIterable: Expr): Expr =>
  Expr.New({
    expr: Expr.GlobalObjects(identifer.fromString("Uint8Array")),
    parameterList: [lengthOrIterable],
  });

/**
 * ```ts
 * new Map(initKeyValueList)
 * ```
 */
export const newMap = (initKeyValueList: Expr): Expr =>
  Expr.New({
    expr: Expr.GlobalObjects(identifer.fromString("Map")),
    parameterList: [initKeyValueList],
  });

/**
 * ```ts
 * new Set(initValueList)
 * ```
 */
export const newSet = (initValueList: Expr): Expr =>
  Expr.New({
    expr: Expr.GlobalObjects(identifer.fromString("Set")),
    parameterList: [initValueList],
  });

/**
 * ```ts
 * console.log(expr)
 * ```
 */
export const consoleLog = (expr: Expr): Statement =>
  Statement.EvaluateExpr(
    callMethod(Expr.GlobalObjects(identifer.fromString("console")), "log", [
      expr,
    ])
  );

/**
 * `Array<elementType>`
 */
export const arrayType = (elementType: Type): Type =>
  Type.WithTypeParameter({
    type: Type.ScopeInGlobal(identifer.fromString("Array")),
    typeParameterList: [elementType],
  });

/**
 * `ReadonlyArray<elementType>`
 */
export const readonlyArrayType = (elementType: Type): Type =>
  Type.WithTypeParameter({
    type: Type.ScopeInGlobal(identifer.fromString("ReadonlyArray")),
    typeParameterList: [elementType],
  });

/**
 * `Uint8Array`
 */
export const uint8ArrayType: Type = Type.ScopeInGlobal(
  identifer.fromString("Uint8Array")
);

/**
 * `Promise<returnType>`
 */
export const promiseType = (returnType: Type): Type =>
  Type.WithTypeParameter({
    type: Type.ScopeInGlobal(identifer.fromString("Promise")),
    typeParameterList: [returnType],
  });

/**
 * `Date`
 */
export const dateType: Type = Type.ScopeInGlobal(identifer.fromString("Date"));

/**
 * `Map<keyType, valueType>`
 */
export const mapType = (keyType: Type, valueType: Type): Type =>
  Type.WithTypeParameter({
    type: Type.ScopeInGlobal(identifer.fromString("Map")),
    typeParameterList: [keyType, valueType],
  });

/**
 * `ReadonlyMap<keyType, valueType>`
 */
export const readonlyMapType = (keyType: Type, valueType: Type): Type =>
  Type.WithTypeParameter({
    type: Type.ScopeInGlobal(identifer.fromString("ReadonlyMap")),
    typeParameterList: [keyType, valueType],
  });

/**
 * `Set<elementType>`
 */
export const setType = (elementType: Type): Type =>
  Type.WithTypeParameter({
    type: Type.ScopeInGlobal(identifer.fromString("Set")),
    typeParameterList: [elementType],
  });

/**
 * `ReadonlySet<elementType>`
 */
export const readonlySetType = (elementType: Type): Type =>
  Type.WithTypeParameter({
    type: Type.ScopeInGlobal(identifer.fromString("ReadonlySet")),
    typeParameterList: [elementType],
  });
