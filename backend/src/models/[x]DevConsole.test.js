import dev from "./DevConsole.js";

describe("콘솔 테스트", () => {
  test("콘솔 데브인지", () => {
		dev.log('test')
    expect(true).toEqual(true);
  });
});
