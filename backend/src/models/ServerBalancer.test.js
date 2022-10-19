import ServerBalancer from "./ServerBalancer";

const User = function User(id, name) {
  this.id = id;
  this.name = name;
  this.params = {
    space: "A",
    channel: 1,
  };
};

describe("서버 할당 테스트", () => {
  const servers = new ServerBalancer(300, 10, false);
  test("서버 사이즈 체크", () => {
    expect(servers.serverSize()).toEqual(10);
  });
  test("서버 2명 추가 시 서버 내 사용자 사이즈 체크", () => {
    const user1 = new User(1, "John");
    const user2 = new User(2, "Doe");
    servers.in(user1);
    servers.in(user2);
    expect(servers.size(1)).toEqual(2);
    servers.clearAll();
  });
  test("서버 홀 인덱스 체크", () => {
    expect(servers.findHoleServer()).toEqual(1);
  });
  test("서버 300명 추가 시 서버 사이즈 체크", () => {
    const users = new Array(300)
      .fill(0)
      .map((a, i) => new User(i + 1, "Doe" + (i + 1)));

    users.forEach((user) => {
      servers.in(user);
    });
    expect(servers.size(1)).toEqual(300);
    expect(servers.size(2)).toEqual(0);
    expect(servers.serverSize()).toEqual(10);
    expect(servers.findHoleServer()).toEqual(2);
    servers.clearAll();
  });
  test("서버 302명 추가 시 서버 사이즈 체크", () => {
    const users = new Array(300 * 10)
      .fill(0)
      .map((a, i) => new User(i + 1, "Doe" + (i + 1)));
    users.forEach((user) => {
      servers.in(user);
    });
    expect(servers.size(1)).toEqual(300);
    expect(servers.findHoleServer()).toEqual(2);
    expect(servers.size(2)).toEqual(2);
    expect(servers.serverSize()).toEqual(10);
    servers.clearAll();
  });
});
