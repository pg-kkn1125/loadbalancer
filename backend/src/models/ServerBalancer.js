import dev from "./DevConsole";

class ServerBalancer {
  #servers = new Map();
  #LIMIT = 0;
  #SERVER_MAX_AMOUNT = 0;
  #currentServer = 1;
  #logable = true;

  constructor(limit, maxServerCount, logable) {
    if (!logable) {
      this.#logable = false;
    }
    this.#initialize(limit, maxServerCount);
  }

  #initialize(limit, maxServerCount) {
    this.#LIMIT = limit || 300;
    this.#SERVER_MAX_AMOUNT = maxServerCount || 1;
    this.#servers.clear();
    for (let i = 1; i <= this.#SERVER_MAX_AMOUNT; i++) {
      this.#servers.set(String(i), []);
    }
    dev.log("server list count::", this.#servers.size);
  }

  #allocateServerNumber() {
    this.#currentServer = this.findHoleServer();
  }

  getCurrentServer() {
    return this.#currentServer;
  }

  select(server) {
    const select = this.#servers.get(String(server));
    this.#logable && dev.log("ServerBalancer.select::", server, select);
    return select;
  }

  checkLimit(server) {
    const isStable = this.select(server).length < this.#LIMIT;
    this.#logable && dev.log("ServerBalancer.checkLimit::", server, isStable);
    return isStable;
  }

  in(ws, initialNum) {
    this.#currentServer = initialNum;
    const isStable = this.checkLimit(this.#currentServer);
    this.#logable &&
      dev.log(
        "ServerBalancer.in::",
        this.#currentServer,
        ws.params.space,
        ws.params.channel,
        isStable
      );
    if (this.#currentServer === 0) {
      // 서버 전체 300 * 10 / 2700명 찼을 때 에러 응답
      return;
    }
    if (isStable) {
      this.select(this.#currentServer).push(ws);
    } else {
      this.#allocateServerNumber();
      dev.log("allocated server number", this.#currentServer);
      this.select(this.#currentServer).push(ws);
    }
    return [isStable, this.#currentServer]; // [안정되어있는지, 추가된 서버는 몇번인지]
  }

  out(server, ws) {
    const index = this.findIndex(server, ws);
    this.#logable &&
      dev.log(
        "ServerBalancer.out::",
        server,
        ws.params.space,
        ws.params.channel,
        index
      );
    if (index !== -1) {
      this.select(server).splice(index, 1);
    }
  }

  findIndex(server, ws) {
    const index = this.select(server).findIndex((userWs) => userWs === ws);
    this.#logable &&
      dev.log(
        "ServerBalancer.findIndex::",
        server,
        ws.params.space,
        ws.params.channel,
        index
      );
    return index;
  }

  findHoleServer() {
    const servers = Array.from(this.#servers.values());
    const holeList = servers.map((server) => server.length < this.#LIMIT);
    const foundIndex = holeList.findIndex((server) => server === true);

    return foundIndex + 1;
  }

  size(server) {
    const currentAmount = this.select(server).length;
    this.#logable &&
      dev.log(
        `ServerBalancer.size :: ${(
          currentAmount +
          " / " +
          this.#LIMIT
        ).padStart(10, " ")} 명`
      );

    return currentAmount;
  }

  serverSize() {
    return this.#servers.size;
  }

  userSizeAll() {
    return Array.from(this.#servers.values()).flat(1).length;
  }

  clear(server) {
    const sv = this.select(server);
    sv.splice(0, sv.length);
    this.#currentServer = this.findHoleServer();
  }

  clearAll() {
    this.#initialize(this.#LIMIT, this.#SERVER_MAX_AMOUNT);
    this.#currentServer = this.findHoleServer();
  }

  isFullServer() {
    const limitServerUserCount = this.#LIMIT * this.#SERVER_MAX_AMOUNT;
    return this.userSizeAll() === limitServerUserCount;
  }
}

const servers = new ServerBalancer(300, 10);

export default ServerBalancer;
export { servers };
