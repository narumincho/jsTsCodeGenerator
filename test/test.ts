import * as main from "../source/main";

test("return string", () => {
  expect(typeof main.toJavaScriptCode()).toBe("string");
});
