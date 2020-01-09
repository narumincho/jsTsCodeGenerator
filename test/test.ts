import * as main from "../source/main";
import { performance } from "perf_hooks";

describe("test", () => {
  const sampleCode: main.NodeJsCode = {
    importNodeModuleList: [main.importNodeModule("sampleModulePath", "id")],
    exportTypeAliasList: [],
    exportVariableList: []
  };
  const start = performance.now();
  const nodeJsTypeScriptCode = main.toNodeJsCodeAsTypeScript(sampleCode);
  const time = performance.now() - start;
  console.log(time.toString() + "ms");
  console.log(nodeJsTypeScriptCode);
  it("performance", () => {
    expect(time).toBeLessThan(10000);
  });
  it("return string", () => {
    expect(typeof nodeJsTypeScriptCode).toBe("string");
  });
  it("include import keyword", () => {
    expect(nodeJsTypeScriptCode).toMatch(/import/);
  });
  it("include import path", () => {
    expect(nodeJsTypeScriptCode).toMatch(/sampleModulePath/);
  });
});
