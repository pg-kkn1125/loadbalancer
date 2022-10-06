class SpaceBalancer {
  spaces = new Map([["A", new Map([["1", new Map()]])]]);

  constructor() {
    /*  */
  }

  addUser(user) {
    console.log(user);
    const { space, channel, deviceID } = user;
    this.spaces.get(space).get(String(channel)).set(deviceID, user);
  }

  findChannel(sp, ch) {
    return this.spaces.get(sp).get(ch);
  }

  findUser(sp, ch, deviceID) {
    return this.spaces.get(sp).get(ch).get(deviceID);
  }

  hasUser(sp, ch, deviceID) {
    return this.spaces.get(sp).get(ch).has(deviceID);
  }

  deleteUser(user) {
    const { space, channel, deviceID } = user;
    this.spaces.get(space).get(String(channel)).delete(deviceID);
  }

  getSpecifyChannelUserCount(sp, ch) {
    // 특정 채널의 유저 인원
    return this.spaces.get(sp).get(String(ch)).size;
  }

  getSpaceChannelAmount(sp) {
    // 특정 공간에 할당된 채널 개수
    return this.spaces.get(sp).size;
  }

  getChannelUserCountByType(sp, ch, type) {
    // 채널에 할당된 뷰어/플레이어 인원
    return this.filter(
      Array.from(this.spaces.get(sp).get(String(ch)).values()),
      (origin) => origin.type === type
    ).length;
    /* .map((sps) => sps.size); */
  }

  filter(origin, predicate) {
    let temp = [];
    for (let i in origin) {
      if (predicate.call(this, origin[i], i, origin)) {
        temp.push(origin[i]);
      }
    }
    return temp;
  }

  addUserInEmptyChannel(user) {}
}

module.exports = SpaceBalancer;
