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
   * @returns
   */
  selectSpace(sp) {
    return this.spaces.get(sp.toLowerCase());
  }

  /**
   * 특정 공간의 채널 선택
   * @param {string} sp - 공간
   * @param {number} ch - 채널
   * @returns
   */
  selectChannel(sp, ch) {
    return this.selectSpace(sp).get(String(ch));
  }

  /**
   * 특정 공간의 채널에 있는 사용자 선택
   * @param {string} sp - 공간
   * @param {number} ch - 채널
   * @param {number} deviceID - 사용자 디바이스 아이디
   * @returns
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
    const { space, channel, deviceID } = user;
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
   * @returns
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
   *
   * @param {User} user
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

export default SpaceBalancer;
