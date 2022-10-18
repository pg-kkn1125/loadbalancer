/**
 * 제한 인원을 설정해서 자동으로 채널을 증설하고
 * 빈 채널 또는 새로운 채널에 사용자를 자동으로
 * 할당하는 객체
 */
class SpaceBalancer {
  #LIMIT = 0;
  #spaces = new Map();

  /**
   * 초기화 값으로 각 채널당 제한 인원을 설정합니다.
   * @param {number} limit 제한 인원
   */
  constructor(limit) {
    this.#LIMIT = limit;
  }

  /**
   * 공간 값 초기 값으로 Map 객체를 지정합니다.
   * @param {'A'|'B'|'C'|'D'|'E'} space - 공간 명
   */
  #initialSpace(space) {
    if (!this.#spaces.has(space.toLowerCase())) {
      this.#spaces.set(space.toLowerCase(), new Map());
    }
  }

  /**
   * 채널 값 초기 값으로 Map 객체를 지정합니다.
   * @param {'A'|'B'|'C'|'D'|'E'} space - 공간 명
   * @param {number} channel - 채널 명
   */
  #initialChannel(space, channel) {
    if (!this.selectSpace(space).has(String(channel))) {
      this.selectSpace(space).set(String(channel), new Map());
    }
  }

  /**
   * Map 객체의 value 값을 배열로 반환합니다.
   * @param {Map} map - 공간 또는 채널
   * @returns {Map[]} - 공간 또는 채널 객체 배열
   */
  #getValues(map) {
    return Array.from(map.values());
  }

  /**
   * 공간을 찾아 반환합니다.
   * @param {'A'|'B'|'C'|'D'|'E'} space - 공간 명
   * @returns {Map} - 공간 객체
   */
  selectSpace(space) {
    this.#initialSpace(space);
    return this.#spaces.get(space.toLowerCase());
  }

  /**
   * 채널을 찾아 반환합니다.
   * @param {'A'|'B'|'C'|'D'|'E'} space - 공간 명
   * @param {number} channel - 채널 명
   * @returns {Map} - 채널 객체
   */
  selectChannel(space, channel) {
    this.#initialChannel(space, channel);
    return this.selectSpace(space).get(String(channel));
  }

  /**
   * 사용자를 찾아 반환합니다.
   * @param {'A'|'B'|'C'|'D'|'E'} space - 공간 명
   * @param {number} channel - 채널 명
   * @param {number} deviceID - 사용자 고유 deviceID
   * @returns
   */
  selectUser(space, channel, deviceID) {
    return this.selectChannel(space, channel).get(String(deviceID));
  }

  /**
   * 사용자를 자동으로 채널에 할당합니다.
   * @param {User} user - 사용자 객체 (channel 값 없음)
   * @returns {User} 채널 할당된 사용자 객체
   */
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

  /**
   * 기존 사용자를 찾아 내용을 덮어씁니다.
   * @param {User} user - 사용자 객체
   */
  overrideUser(user) {
    this.selectChannel(user.space, user.channel).set(
      String(user.deviceID),
      user
    );
  }

  /**
   * 빈 채널 또는 증설되는 채널의 인덱스를 찾아 반환합니다.
   * @param {'A'|'B'|'C'|'D'|'E'} space - 공간 명
   * @returns {number} - 빈 채널 또는 증설된 채널 인덱스
   */
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

  /**
   * 사용자를 찾아 채널에서 제거합니다.
   * @param {'A'|'B'|'C'|'D'|'E'} space - 공간 명
   * @param {number} channel - 채널 명
   * @param {number} deviceID - 사용자 고유 deviceID
   */
  removeUser(space, channel, deviceID) {
    this.selectChannel(space, channel).delete(String(deviceID));
    if (this.userCount(space, channel) === 0) {
      this.selectSpace(space).delete(String(channel));
    }
    if (this.channelCount(space) === 0) {
      this.#spaces.delete(space.toLowerCase());
    }
  }

  /**
   * 채널을 삭제합니다.
   * @param {'A'|'B'|'C'|'D'|'E'} space - 공간 명
   * @param {number} channel - 채널 명
   */
  removeChannel(space, channel) {
    this.selectSpace(space).delete(String(channel));
    if (this.channelCount(space) === 0) {
      this.#spaces.delete(space.toLowerCase());
    }
  }

  /**
   * 사용자의 deviceID로 모든 공간과 모든 채널에서 조회합니다.
   * @param {number} deviceID - 사용자 고유 deviceID
   * @returns {User|undefined} - 사용자 객체 또는 undefined
   */
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

  /**
   * 공간을 유지하면서 Map객체 내부를 비웁니다.
   * @param {'A'|'B'|'C'|'D'|'E'} space - 공간 명
   */
  clearSpace(space) {
    this.selectSpace(space).clear();
  }

  /**
   * 채널을 유지하면서 Map객체를 내부를 비웁니다.
   * @param {'A'|'B'|'C'|'D'|'E'} space - 공간 명
   * @param {number} channel - 채널 명
   */
  clearChannel(space, channel) {
    this.selectChannel(space, channel).clear();
  }

  /**
   * 공간을 모두 비웁니다. (가급적 사용 금지)
   */
  clearAll() {
    this.#spaces.clear();
  }

  /**
   * 사용자가 할당된 채널의 모든 인원 수를 반환합니다.
   * @returns {number} - 채널 내 사용자 인원 수
   */
  userCount(space, channel) {
    return this.selectChannel(space, channel).size;
  }

  /**
   * 특정 공간의 채널 수를 반환합니다.
   * @param {'A'|'B'|'C'|'D'|'E'} space - 공간 명
   * @returns {Map} - 특정 공간의 채널 수
   */
  channelCount(space) {
    return this.selectSpace(space).size;
  }

  /**
   * 공간의 개수를 반환합니다.
   * @returns {number} - 공간의 개수
   */
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
   * 현재 스레드에 존재하는 모든 사용자 수를 반환합니다.
   * @returns {number} - 스레드 내 모든 사용자 수
   */
  checkThreadUserAmount() {
    let totalUserAmount = 0;
    totalUserAmount += this.checkSpaceUserAmount("A");
    totalUserAmount += this.checkSpaceUserAmount("B");
    totalUserAmount += this.checkSpaceUserAmount("C");
    totalUserAmount += this.checkSpaceUserAmount("D");
    totalUserAmount += this.checkSpaceUserAmount("E");
    return totalUserAmount;
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

export default SpaceBalancer;
