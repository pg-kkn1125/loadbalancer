describe("비동기 테스트 슈트", () => {
  test("1+1 시간차이 테스트 1", () => {
    const fetchPlus = (performance, cb) => {
      let start = performance();
      new Promise((resolve, reject) => {
        resolve(1 + 1);
      }).then((result) => {
        let end = performance();
        cb(result, end - start);
      });
    };

    fetchPlus(performance.now, (sum, latency) => {
      console.log(latency);
      expect(1 + 1).toEqual(sum);
    });
  });
  test("1+1 시간차이 테스트 2", () => {
    function sum() {
      return 1 + 1;
    }
    let start = performance.now();
    sum();
    let end = performance.now();
    console.log(end - start);
    expect(1 + 1).toEqual(2);
  });
});
