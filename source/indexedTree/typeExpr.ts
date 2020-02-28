import * as type from "../type";

/**
 * グローバル空間(グローバル変数、直下の関数の引数名)に出ている型の名前を集める
 * @param typeExpr 型の式
 * @param scanData グローバルで使われている名前の集合などのコード全体の情報の収集データ。上書きする
 */
export const scan = (
  typeExpr: type.TypeExpr,
  scanData: type.GlobalNameData
): void => {
  switch (typeExpr._) {
    case type.TypeExpr_.Number:
    case type.TypeExpr_.String:
    case type.TypeExpr_.Boolean:
    case type.TypeExpr_.Null:
    case type.TypeExpr_.Undefined:
    case type.TypeExpr_.EnumTagLiteral:
      return;

    case type.TypeExpr_.Object:
      for (const [, value] of typeExpr.memberList) {
        scan(value.typeExpr, scanData);
      }
      return;

    case type.TypeExpr_.Function:
      for (const parameter of typeExpr.parameterList) {
        scan(parameter, scanData);
      }
      scan(typeExpr.return, scanData);
      return;

    case type.TypeExpr_.Union:
      for (const oneType of typeExpr.types) {
        scan(oneType, scanData);
      }
      return;

    case type.TypeExpr_.WithTypeParameter:
      scan(typeExpr.typeExpr, scanData);
      for (const parameter of typeExpr.typeParameterList) {
        scan(parameter, scanData);
      }
      return;

    case type.TypeExpr_.ImportedType:
      scanData.importedModulePath.add(typeExpr.path);
      return;

    case type.TypeExpr_.GlobalType:
      scanData.globalNameSet.add(typeExpr.name);
      return;
  }
};
