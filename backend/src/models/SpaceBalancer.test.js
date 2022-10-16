import SpaceBalancer from "./SpaceBalancer";
import User from "./User"

describe("생성자 테스트", () => {
  test("스페이스 밸런서 테스트", () => {
    const sb = new SpaceBalancer(50);
    expect(sb.LIMIT).toEqual(50);
  });
});

describe("데이터 입출력 테스트", () => {
  test("유저 데이터 입력", () => {
    const sb = new SpaceBalancer(50);
    const user = new User({
      id: 0,
      type: "player",
      nickname: "John",
      deviceID: 0,
      thread: 1,
      space: "a",
      channel: 1,
    });
    sb.addUserInEmptyChannel(user);
    expect(sb.hasUser(user.space, user.channel, user.deviceID)).toBeTruthy();
  });
  test("유저 데이터 삭제 테스트", () => {
    const sb = new SpaceBalancer(50);
    const user = new User({
      id: 0,
      type: "player",
      nickname: "John",
      deviceID: 0,
      thread: 1,
      space: "a",
      channel: 1,
    });
    sb.addUserInEmptyChannel(user);
    expect(sb.hasUser(user.space, user.channel, user.deviceID)).toBeTruthy();
    sb.deleteUser(user);
    expect(sb.hasUser(user.space, user.channel, user.deviceID)).toBeFalsy();
  });
});

describe("데이터 찾기 테스트", () => {
  const sb = new SpaceBalancer(50);
  const users = new Array(5).fill(0).map((u, i) => {
    const user = new User({
      id: i,
      type: "player",
      nickname: "John",
      deviceID: i,
      thread: 1,
      space: "a",
      channel: 1,
    });
    sb.addUserInEmptyChannel(user);
    return user;
  });
  test("사용자 찾기 테스트", () => {
    expect(sb.selectUser("a", 1, 3)).toEqual(users[3]);
    // expect(sb.selectUser("a", 1, 3)).toEqual(users[2]); // fail
  });
  test("사용자 삭제 후 찾기 테스트", () => {
    sb.deleteUser(users[3]);
    expect(sb.hasUser("a", 1, 3)).toBeFalsy();
  });
});

describe("사용자 추가 시 채널 증설 테스트", () => {
  const sb = new SpaceBalancer(50);
  const users = new Array(51).fill(0).map((u, i) => {
    const user = new User({
      id: i,
      type: "player",
      nickname: "John",
      deviceID: i,
      thread: 1,
      space: "a",
      channel: 1,
    });
    sb.addUserInEmptyChannel(user);
    return user;
  });
  test("유저 51명 추가 시 채널 2개 인지?", () => {
    expect(sb.getSpaceChannelAmount("a")).toEqual(2);
  });
  test("채널 2 인원 체크", () => {
    expect(sb.getSpecifyChannelUserCount("a", 2)).toEqual(1);
    expect(sb.selectUser("a", 2, 50)).toEqual(users[50]);
    expect(users[50].channel).toEqual(2);
  });
  test("유저 1번 채널에 1명 제거 후 인원 체크", () => {
    sb.deleteUser(users[2]);
    expect(sb.getSpecifyChannelUserCount("a", 1)).toEqual(49);
  });
  test("유저 빈 공간 추가 테스트", () => {
    sb.addUserInEmptyChannel(users[2]);
    expect(sb.getSpecifyChannelUserCount("a", 1)).toEqual(50);
  });
  test("채널 만원 시 다음 채널로 자동 할당 테스트", () => {
    sb.deleteUser(users[50]);
    sb.addUserInEmptyChannel(users[50]);
    expect(sb.getSpecifyChannelUserCount("a", 2)).toEqual(1);
  });
  test("공간 인원 확인", () => {
    expect(sb.checkSpaceUserAmount("a")).toEqual(51);
  });
  test("채널 인원 확인 - 1", () => {
    expect(sb.checkChannelUserAmount("a", 1)).toEqual(50);
  });
  test("채널 인원 확인 - 2", () => {
    console.log(sb.selectChannel("a", 2).get('50').channel)
    expect(sb.checkChannelUserAmount("a", 2)).toEqual(1);
  });
  test("채널 인원 확인 - 3", () => {
    expect(sb.selectChannel("a", 2).size).toEqual(1);
  });
  test("채널 내 뷰어 확인", () => {
    const viewer = new User({
      id: 52,
      type: "viewer",
      nickname: "John",
      deviceID: 52,
      thread: 1,
      space: "a",
      channel: 1,
    });
    sb.addUserInEmptyChannel(viewer);
    expect(sb.checkChannelUserAmountByType("a", 1, "viewer")).toEqual(0);
    expect(sb.checkChannelUserAmountByType("a", 2, "viewer")).toEqual(1);
  });
  test("채널 내 플레이어 확인", () => {
    expect(sb.checkChannelUserAmountByType("a", 1, "player")).toEqual(50);
    expect(sb.checkChannelUserAmountByType("a", 2, "player")).toEqual(1);
  });
  test("채널 내 플레이어 확인", () => {
    const viewer = new User({
      id: 53,
      type: "viewer",
      nickname: "John",
      deviceID: 53,
      thread: 1,
      space: "a",
      channel: 1,
    });
    sb.addUserInEmptyChannel(viewer);
    expect(sb.checkChannelUserAmountByType("a", 2, "viewer")).toEqual(2);
  });
  test("채널 만원 확인", () => {
    expect(sb.isChannelFull("a", 1)).toBeTruthy();
  });
});

describe("채널 생성 전에서 마지막 채널 선택 시도 시", () => {
  const sb = new SpaceBalancer(50);
  test("채널 없음 확인", () => {
    expect(sb.spaces.has("a")).toBeFalsy();
  });
  test("아무것도 없을 때 lastChannel을 선택 시도하면?", () => {
    expect(sb.selectLastChannel("a")).toBeNull();
  });
});
