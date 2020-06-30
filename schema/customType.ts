import * as name from "./name";
import { Type } from "@narumincho/type/source/data";

const noParameterType = (typeName: string): Type =>
  Type.Custom({
    name: typeName,
    parameterList: [],
  });

export const codeType = noParameterType(name.codeType);
export const code = noParameterType(name.code);
export const exportDefinition = noParameterType(name.exportDefinition);
export const statement = noParameterType(name.statement);
export const typeAlias = noParameterType(name.typeAlias);
export const function_ = noParameterType(name.function_);
export const variable = noParameterType(name.variable);
export const identifer = noParameterType(name.identifer);
export const type = noParameterType(name.type);
export const parameterWithDocument = noParameterType(
  name.parameterWithDocument
);
export const parameter = noParameterType(name.parameter);
export const expr = noParameterType(name.expr);
export const unaryOperator = noParameterType(name.unaryOperator);
export const binaryOperator = noParameterType(name.binaryOperator);
export const unaryOperatorExpr = noParameterType(name.unaryOperatorExpr);
export const binaryOperatorExpr = noParameterType(name.binaryOperatorExpr);
export const conditionalOperatorExpr = noParameterType(
  name.conditionalOperatorExpr
);
export const arrayItem = noParameterType(name.arrayItem);
export const member = noParameterType(name.member);
export const lambdaExpr = noParameterType(name.lambdaExpr);
export const importedVariable = noParameterType(name.importedVariable);
export const getExpr = noParameterType(name.getExpr);
export const callExpr = noParameterType(name.callExpr);
export const TypeAssertion = noParameterType(name.typeAssertion);
