class SpaceBalancer {
  spaces = new Map();
  LIMIT = 0;
  /**
   * @param {number} limit - 채널 당 제한 인원
   */
  constructor(limit) {
    this.LIMIT = limit;
  }

  /**
   * 해당 공간의 채널에 있는 플레이어 가져오기
   * @param {string} sp - 공간
   * @param {number} ch - 채널
   * @returns
   */
  getPlayers(sp, ch) {
    return this.filter(
      Array.from(this.selectChannel(sp, ch).values()),
      (origin) => origin.type === "player"
    );
  }

  /**
   * 채널 증가시 변경시키는 메서드
   * @param {User} user - 유저 객체
   * @param {number} changeChannelNumber - 변경된 채널 넘버
   */
  changeUserChannel(user, changeChannelNumber) {
    Object.assign(user, {
      channel: changeChannelNumber,
    });
  }

  /**
   * 공간 추가
   * @param {string} sp - 공간
   */
  #addSpace(sp) {
    this.spaces.set(sp.toLowerCase(), new Map());
  }

  /**
   * 새로운 채널 추가
   */
  addChannel(sp, ch) {
    this.selectSpace(sp).set(String(ch), new Map());
  }

  /**
   * 마지막 인덱스로 새로운 채널 추가
   * @param {string} sp - 공간
   */
  addChannelLast(sp) {
    const lastIndex = this.getSpaceChannelAmount(sp) + 1;
    this.addChannel(sp, lastIndex);
    return lastIndex;
  }

  /**
   * 공간 선택
   * @param {string} sp - 공간
   * @returns {object|undefined} - 공간 반환
   */
  selectSpace(sp) {
    return this.spaces.get(sp.toLowerCase());
  }

  /**
   * 특정 공간의 채널 선택
   * @param {string} sp - 공간
   * @param {number} ch - 채널
   * @returns {object|undefined} - 채널 반환
   */
  selectChannel(sp, ch) {
    return this.selectSpace(sp).get(String(ch));
  }

  /**
   * 특정 공간의 채널에 있는 사용자 선택
   * @param {string} sp - 공간
   * @param {number} ch - 채널
   * @param {number} deviceID - 사용자 디바이스 아이디
   * @returns {User|undefined} - 특정 공간 -> 채널의 유저 반환
   */
  selectUser(sp, ch, deviceID) {
    return this.selectChannel(sp, ch).get(String(deviceID));
  }

  /**
   * 특정 공간의 마지막 채널 선택
   * @param {string} sp - 공간
   * @returns {Map|null} 채널 반환
   */
  selectLastChannel(sp) {
    const hasSpace = this.hasSpace(sp);

    if (!hasSpace) {
      this.#addSpace(sp);
    }

    const convertValuesArray = Array.from(this.selectSpace(sp).values());
    const newChannelIndex = convertValuesArray.length;
    const last = convertValuesArray.slice(-1);

    if (last.length === 1) {
      return [last[0], newChannelIndex];
    } else {
      return null;
    }
  }

  /**
   * 특정 공간의 채널이 가득 찼는지 확인
   * @param {string} sp - 공간
   * @param {number} ch - 채널
   * @returns {boolean} true/false 값을 반환
   */
  isChannelFull(sp, ch) {
    return this.selectChannel(sp, ch).size === this.LIMIT;
  }

  /**
   * 공간 내의 모든 채널이 가득 찼는지 조회
   * @param {string} sp - 공간
   * @returns {boolean} true/false
   */
  isSpaceFull(sp) {
    const convertChannelArray = Array.from(this.selectSpace(sp).values());
    return convertChannelArray.every((channel) => channel.size === this.LIMIT);
  }

  /**
   * 특정 공간의 채널에 사용자가 있는지 확인
   * @param {string} sp - 공간
   * @param {number} ch - 채널
   * @param {number} deviceID - 사용자 디바이스 아이디
   * @returns {boolean} true/false 값을 반환
   */
  hasUser(sp, ch, deviceID) {
    return this.selectChannel(sp, ch).has(String(deviceID));
  }

  hasChannel(sp, ch) {
    return this.selectSpace(sp).has(String(ch));
  }

  /**
   * 공간 여부 조회
   * @param {string} sp
   * @returns {boolean} true/false
   */
  hasSpace(sp) {
    return this.spaces.has(sp.toLowerCase());
  }

  /**
   * 특정 공간의 채널에 위치한 사용자를 삭제
   * @param {User} user - 사용자 객체
   */
  deleteUser(user) {
    const space = user.space,
      channel = user.channel,
      deviceID = user.deviceID;
    if (this.hasUser(space, channel, deviceID)) {
      this.selectChannel(space, channel).delete(String(deviceID));
    }
  }

  /**
   * 특정 채널의 사용자 인원 수 조회
   * @param {string} sp - 공간
   * @param {number} ch - 채널
   * @returns {number} 사용자 인원 수 반환
   */
  getSpecifyChannelUserCount(sp, ch) {
    return this.selectSpace(sp).get(String(ch)).size;
  }

  /**
   * 특정 공간에 할당된 채널의 개수 조회
   * @param {string} sp - 공간
   * @returns {number} 채널 개수 반환
   */
  getSpaceChannelAmount(sp) {
    // 특정 공간에 할당된 채널 개수
    return this.selectSpace(sp).size;
  }

  /**
   * 채널에 할당된 사용자 인원을 타입 인자로 조회
   * @param {string} sp - 공간
   * @param {number} ch - 채널
   * @param {string} type - 사용자 타입
   * @returns {number} 타입에 맞는 사용자 수 반환
   */
  checkChannelUserAmountByType(sp, ch, type) {
    // 채널에 할당된 뷰어/플레이어 인원
    return this.filter(
      Array.from(this.selectChannel(sp, ch).values()),
      (origin) => origin.type === type
    ).length;
  }

  /**
   * 채널 내 사용자 인원 수 조회
   * @param {string} sp
   * @param {number} ch
   */
  checkChannelUserAmount(sp, ch) {
    return this.selectChannel(sp, ch).size;
  }

  /**
   * 공간 내 사용자 인원 수 조회
   * @param {string} sp
   * @returns {number} - 공간 내 사용자 인원 수 반환
   */
  checkSpaceUserAmount(sp) {
    return Array.from(this.selectSpace(sp).values()).reduce(
      (acc, cur) => (acc += cur.size),
      0
    );
  }

  /**
   * 채널 기준으로 필터링
   * @param {Array} origin - Map객체로 이루어진 배열
   * @param {Func} predicate - 필터 순회 함수
   * @returns {Array[Map]} 필터된 새로운 채널 배열 반환
   */
  filter(origin, predicate) {
    let temp = [];
    for (let i in origin) {
      if (predicate.call(this, origin[i], i, origin)) {
        temp.push(origin[i]);
      }
    }
    return temp;
  }

  /**
   * 유저 deviceID로 조회해서 기존 유저 정보 덮어쓰기
   * @param {User} user 유저 데이터
   */
  overrideUser(user) {
    this.selectChannel(user.space, user.channel).set(
      String(user.deviceID),
      user
    );
  }

  /**
   * 자동으로 빈 채널을 찾아 사용자를 할당 혹은 모두 차있으면 마지막 채널에 사용자를 할당
   * @param {User} user - 사용자 객체
   */
  addUserInEmptyChannel(user) {
    // 공간이 없으면 생성
    if (!this.hasSpace(user.space)) {
      this.#addSpace(user.space);
    }

    // 채널이 없으면 생성
    if (!this.hasChannel(user.space, user.channel)) {
      this.addChannel(user.space, user.channel);
    }

    // 유저가 존재하면 덮어쓰기
    if (this.hasUser(user.space, user.channel)) {
      this.overrideUser(user);
      return;
    }

    // 공간 선택
    const spaces = this.selectSpace(user.space);
    // 채널 배열로 변환
    const channelArray = Array.from(spaces.values());
    // 빈 채널 인덱스
    const foundHoleChannelIndex = channelArray.findIndex(
      (channel) => channel.size < this.LIMIT
    );

    // 빈 채널이 있다면 빈 채널 인덱스를 사용자의 채널에 저장하고 해당 채널에 할당
    if (foundHoleChannelIndex > -1) {
      const realChannelNumber = foundHoleChannelIndex + 1;
      this.changeUserChannel(user, realChannelNumber);
      if (!this.hasChannel(user.space, user.channel)) {
        this.addChannel(user.space, user.channel);
      }
      const foundHoleChannel = this.selectSpace(user.space).get(
        String(user.channel)
      );
      foundHoleChannel.set(String(user.deviceID), user);
    } else {
      // 빈 채널 없이 모두 차있을때
      if (this.isSpaceFull(user.space)) {
        const lastIndex = this.addChannelLast(user.space);
        Object.assign(user, {
          channel: lastIndex,
        });
      }

      const result = this.selectLastChannel(user.space);
      if (result) {
        const [last, index] = result;
        Object.assign(user, {
          channel: index,
        });
        last.set(String(user.deviceID), user);
      } else {
        Object.assign(user, {
          channel: user.channel,
        });
      }
    }
    return user;
  }
}


/**
 * viewer
 * {
 *   id: "",
 *   device: "",
 * }
 *
 * player
 * {
 *   id: "",
 *   device: "",
 *   authority: "",
 *   avatar: "",
 *   pox: "",
 *   poy: "",
 *   poz: "",
 *   roy: "",
 *   state: "",
 * }
 */

/**
 * 사용자 생성 클래스
 */
class User {
  type = null;
  timestamp = null;
  deviceID = null;
  server = null;
  space = null;
  channel = null;
  device = null;
  host = null;
  id = null;
  nickname = null;
  authority = null;
  avatar = null;
  pox = null;
  poy = null;
  poz = null;
  roy = null;
  state = null;
  /**
   * 사용자 생성자
   * @param {object} data 사용자 데이터
   * @requires @param {'viewer'|'player'} data.type 사용자 타입 (서버 할당) [ viewer | player ]
   * @param {number} data.timestamp 생성 시간 (서버 할당) [ viewer | player ]
   * @param {number} data.deviceID 디바이스 아이디 (서버 할당) [ viewer | player ]
   * @param {number} data.server 서버 (서버 할당) [ viewer | player ]
   * @param {string} data.space 공간 (서버 할당) [ viewer | player ]
   * @param {number} data.channel 채널 (서버 할당) [ viewer | player ]
   * @param {string} data.device 디바이스 정보 [ viewer | player ]
   * @param {string} data.host 호스트 경로 [ viewer | player ]
   *
   * 플레이어 타입 필드
   * @param {number} data.id 아이디 [ player ]
   * @param {string} data.nickname 닉네임 [ player ]
   * @param {string} data.authority 권한 [ player ]
   * @param {string} data.avatar 아바타 [ player ]
   * @param {number} data.pox 캐릭터 x값 [ player ]
   * @param {number} data.poy 캐릭터 y값 [ player ]
   * @param {number} data.poz 캐릭터 z값 [ player ]
   * @param {number} data.roy ?? [ player ]
   * @param {string} data.state 상태(online/offline) [ player ]
   */
  constructor(data) {
    const isViewer = data.type === "viewer" && "Viewer";
    const isPlayer = data.type === "player" && "Player";

    if (isViewer) this.#createViewerData(data);
    if (isPlayer) this.#createPlayerData(data);
  }

  #createViewerData({
    type = null,
    server = null,
    space = null,
    channel = null,
    device = null,
    deviceID = null,
    host = null,
    timestamp = null,
  }) {
    this.type = type;
    this.server = server;
    this.space = space;
    this.channel = channel;
    this.device = device;
    this.deviceID = deviceID;
    this.host = host;
    this.timestamp = timestamp;
  }

  #createPlayerData({
    type = null,
    id = null,
    nickname = null,
    server = null,
    space = null,
    channel = null,
    device = null,
    deviceID = null,
    authority = null,
    avatar = null,
    pox = null,
    poy = null,
    poz = null,
    roy = null,
    state = null,
    host = null,
    timestamp = null,
  }) {
    this.type = type;
    this.id = id;
    this.nickname = nickname;
    this.server = server;
    this.space = space;
    this.channel = channel;
    this.device = device;
    this.deviceID = deviceID;
    this.authority = authority;
    this.avatar = avatar;
    this.pox = pox;
    this.poy = poy;
    this.poz = poz;
    this.roy = roy;
    this.state = state;
    this.host = host;
    this.timestamp = timestamp;
  }

  toJSON() {
    return Object.entries(this).reduce((acc, [key, value]) => {
      if (value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }
}

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
    // console.log(sb.selectChannel("a", 2).get("50").channel);
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

describe("50명 뷰어 생성 후 50명 로그인", () => {
  const sb = new SpaceBalancer(50);
  const users = new Array(50).fill(0).map((u, i) => {
    const user = new User({
      id: i,
      type: "viewer",
      nickname: "John",
      deviceID: i,
      thread: 1,
      space: "a",
      channel: 1,
    });
    sb.addUserInEmptyChannel(user);
    return user;
  });
  test("50명 뷰어 생성", () => {
    console.log(sb.checkChannelUserAmountByType("A", 1, "viewer"));
  });
  test("50명 플레이어 생성", () => {
    const users = new Array(50).fill(0).map((u, i) => {
      const user = new User({
        id: i,
        type: "player",
        nickname: "John",
        deviceID: i,
        thread: 1,
        space: "a",
        channel: 1,
      });
      sb.overrideUser(user);
      return user;
    });
    console.log(sb.checkChannelUserAmountByType("A", 1, "viewer"));
    console.log(sb.checkChannelUserAmountByType("A", 1, "player"));
    // console.log(sb.checkChannelUserAmountByType("A", 2, "viewer"));
    // console.log(sb.checkChannelUserAmountByType("A", 2, "player"));
  });
});
