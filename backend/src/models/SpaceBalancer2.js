import dev from "./DevConsole";

class SpaceBalancer2 {
  #LIMIT = 0;
  #spaces = new Map();

  constructor(limit) {
    this.#LIMIT = limit;
  }

  #initialSpace(space) {
    if (!this.#spaces.has(space.toLowerCase())) {
      this.#spaces.set(space.toLowerCase(), new Map());
    }
  }

  #initialChannel(space, channel) {
    if (!this.selectSpace(space).has(String(channel))) {
      this.selectSpace(space).set(String(channel), new Map());
    }
  }

  #getValues(map) {
    return Array.from(map.values());
  }

  selectSpace(space) {
    this.#initialSpace(space);
    return this.#spaces.get(space.toLowerCase());
  }

  selectChannel(space, channel) {
    this.#initialChannel(space, channel);
    return this.selectSpace(space).get(String(channel));
  }

  selectUser(space, channel, deviceID) {
    return this.selectChannel(space, channel).get(String(deviceID));
  }

  // 유저가 가진 채널에 할당
  add(user) {
    // space 초기화
    let renewUser = null;
    // 1. 기존 유저 채널 있는지 확인
    const foundUser = this.findUserByDeviceID(user.deviceID);
    if (Boolean(foundUser)) {
      // 1-1. 있으면 덮어쓰기
      renewUser = Object.assign(foundUser, user);
      this.overrideUser(renewUser);
    } else {
      // 1-2. 없으면 유저 채널 값 할당
      renewUser = Object.assign(user, {
        channel: this.allocateChannel(user.space),
      });
      // 2. 유저 해당 채널에 입장
      this.selectChannel(renewUser.space, renewUser.channel).set(
        String(renewUser.deviceID),
        renewUser
      );
    }

		return renewUser;
  }

  overrideUser(user) {
    this.selectChannel(user.space, user.channel).set(
      String(user.deviceID),
      user
    );
  }

  allocateChannel(space) {
    const spaces = this.selectSpace(space);
    const channelArray = Array.from(spaces.values());
    const holeIndex = channelArray.findIndex(
      (channel) => channel.size < this.#LIMIT
    );
    if (channelArray.length === 0) {
      return 1;
    } else {
      if (holeIndex !== -1) {
        return holeIndex + 1;
      } else {
        return spaces.size + 1;
      }
    }
  }

  removeUser(space, channel, deviceID) {
    this.selectChannel(space, channel).delete(String(deviceID));
    if (this.userCount(space, channel) === 0) {
      this.selectSpace(space).delete(String(channel));
    }
    if (this.channelCount(space) === 0) {
      this.#spaces.delete(space.toLowerCase());
    }
  }

  removeChannel(space, channel) {
    this.selectSpace(space).delete(String(channel));
    if (this.channelCount(space) === 0) {
      this.#spaces.delete(space.toLowerCase());
    }
  }

  findUserByDeviceID(deviceID) {
    const spaceArray = this.#getValues(this.#spaces);
    for (let channels of spaceArray) {
      for (let channel of this.#getValues(channels)) {
        if (channel.has(String(deviceID))) {
          return channel.get(String(deviceID));
        }
      }
    }

    return undefined;
  }

  clearSpace(space) {
    this.selectSpace(space).clear();
  }

  clearChannel(space, channel) {
    this.selectChannel(space, channel).clear();
  }

  clearAll() {
    this.#spaces.clear();
  }

  /**
   * counter
   */
  userCount(space, channel) {
    return this.selectChannel(space, channel).size;
  }

  channelCount(space) {
    return this.selectSpace(space).size;
  }

  spaceCount() {
    return this.#spaces.size;
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
}

export default SpaceBalancer2;
