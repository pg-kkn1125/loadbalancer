import SpaceBalancer from "./SpaceBalancer";
import User from "./User";

describe("채널 증설 테스트", () => {
  const sb = new SpaceBalancer(50);
  const indexArray = (amount) => new Array(amount).fill(0).map((a, i) => i + 1);
  test("50개 생성", () => {
    for (let index of indexArray(1)) {
      const user = new User({
        id: index,
        type: "player",
        nickname: "John",
        deviceID: index,
        thread: 1,
        space: "a",
      }).toJSON();
      sb.add(user);
    }
    expect(sb.userCount("A", 1)).toEqual(1);
    sb.clearAll();
  });
  test("51개 생성", () => {
    for (let index of indexArray(51)) {
      const user = new User({
        id: index,
        type: "player",
        nickname: "John",
        deviceID: index,
        thread: 1,
        space: "a",
      }).toJSON();
      sb.add(user);
    }
    expect(sb.channelCount("A")).toEqual(2);
    sb.clearAll();
  });
  test("50 뷰어 후 50 로그인", () => {
    for (let index of indexArray(50)) {
      const user = new User({
        id: index,
        type: "viewer",
        nickname: "John",
        deviceID: index,
        thread: 1,
        space: "a",
      }).toJSON();
      sb.add(user);
    }
    for (let index of indexArray(50)) {
      const user = new User({
        id: index,
        type: "player",
        nickname: "John",
        deviceID: index,
        thread: 1,
        space: "a",
      }).toJSON();
      sb.add(user);
    }
    expect(sb.userCount("A", 1)).toEqual(50);
    sb.clearAll();
  });
  test("삭제 테스트 1", () => {
    for (let index of indexArray(50)) {
      const user = new User({
        id: index,
        type: "viewer",
        nickname: "John",
        deviceID: index,
        thread: 1,
        space: "a",
      }).toJSON();
      sb.add(user);
    }
    sb.removeUser("A", 1, 1);
    // expect(sb.userCount("A", 1)).toEqual(50);
    expect(sb.userCount("A", 1)).toEqual(49);
    sb.clearAll();
  });
  test("삭제 테스트 2", () => {
    for (let index of indexArray(50)) {
      const user = new User({
        id: index,
        type: "viewer",
        nickname: "John",
        deviceID: index,
        thread: 1,
        space: "a",
      }).toJSON();
      sb.add(user);
    }
    sb.removeUser("A", 1, 1);

    sb.add({
      id: 51,
      type: "viewer",
      nickname: "John",
      deviceID: 51,
      thread: 1,
      space: "a",
    });
    // expect(sb.userCount("A", 1)).toEqual(50);
    // expect(sb.userCount("A", 1)).toEqual(49);
    expect(sb.findUserByDeviceID(51)).toEqual({
      id: 51,
      type: "viewer",
      nickname: "John",
      deviceID: 51,
      thread: 1,
      space: "a",
      channel: 1,
    });
    sb.clearAll();
  });
});
