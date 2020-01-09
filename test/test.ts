import * as main from "../source/main";
import { performance } from "perf_hooks";

test("return string", () => {
  expect(typeof main.toJavaScriptCode()).toBe("string");
});

test("performance", () => {
  const start = performance.now();
  main.toJavaScriptCode();
  const time = performance.now() - start;
  console.log(time.toString() + "ms");
  expect(time).toBeLessThan(10000);
});
