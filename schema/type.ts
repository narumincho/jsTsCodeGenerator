import * as definyCoreData from "definy-core/source/data";
import * as id from "./typePartId";

const noParameterType = (
  typePartId: definyCoreData.TypePartId
): definyCoreData.Type => ({
  typePartId,
  parameter: [],
});

export const CodeType = noParameterType(id.CodeType);
export const Code = noParameterType(id.Code);
export const ExportDefinition = noParameterType(id.ExportDefinition);
export const Statement = noParameterType(id.Statement);
export const TypeAlias = noParameterType(id.TypeAlias);
export const Function_ = noParameterType(id.Function_);
export const Variable = noParameterType(id.Variable);
export const Identifer = noParameterType(id.Identifer);
export const Type = noParameterType(id.Type);
export const ParameterWithDocument = noParameterType(id.ParameterWithDocument);
export const Parameter = noParameterType(id.Parameter);
export const Expr = noParameterType(id.Expr);
export const UnaryOperator = noParameterType(id.UnaryOperator);
export const BinaryOperator = noParameterType(id.BinaryOperator);
export const UnaryOperatorExpr = noParameterType(id.UnaryOperatorExpr);
export const BinaryOperatorExpr = noParameterType(id.BinaryOperatorExpr);
export const ConditionalOperatorExpr = noParameterType(
  id.ConditionalOperatorExpr
);
export const ArrayItem = noParameterType(id.ArrayItem);
export const Member = noParameterType(id.Member);
export const KeyValue = noParameterType(id.KeyValue);
export const LambdaExpr = noParameterType(id.LambdaExpr);
export const ImportedVariable = noParameterType(id.ImportedVariable);
export const GetExpr = noParameterType(id.GetExpr);
export const CallExpr = noParameterType(id.CallExpr);
export const TypeAssertion = noParameterType(id.TypeAssertion);
export const SetStatement = noParameterType(id.SetStatement);
export const IfStatement = noParameterType(id.IfStatement);
export const VariableDefinitionStatement = noParameterType(
  id.VariableDefinitionStatement
);
export const FunctionDefinitionStatement = noParameterType(
  id.FunctionDefinitionStatement
);
export const ForStatement = noParameterType(id.ForStatement);
export const ForOfStatement = noParameterType(id.ForOfStatement);
export const SwitchStatement = noParameterType(id.SwitchStatement);
export const Pattern = noParameterType(id.Pattern);
export const MemberType = noParameterType(id.MemberType);
export const FunctionType = noParameterType(id.FunctionType);
export const TypeWithTypeParameter = noParameterType(id.TypeWithTypeParameter);
export const IntersectionType = noParameterType(id.IntersectionType);
export const ImportedType = noParameterType(id.ImportedType);
