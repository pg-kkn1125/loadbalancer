/**
 * Protobuf 메세지 클래스 설정
 */
const protobuf = require("protobufjs");

class Message {
  #message = null;

  constructor(properties) {
    this.#setDeclare(properties);
  }

  #setDeclare(properties) {
    const entries = Object.entries(properties);

    for (let idx in entries) {
      const [key, type] = entries[idx];
      const declare = protobuf.Field.d(Number(idx), type, "required");
      declare(protobuf.Message.prototype, key);
    }
  }

  createMessage(data) {
    this.#message = new protobuf.Message(data);
    return this.#message;
  }

  static encode(data) {
    return protobuf.Message.encode(new protobuf.Message(data));
  }

  static decode(uint8Array) {
    return protobuf.Message.decode(uint8Array);
  }
}

const declare = new Message({
  id: "fixed32",
  nickname: "string",
  type: "string",
  device: "string",
  authority: "bool",
  avatar: "string",
  pox: "float",
  poy: "float",
  poz: "float",
  roy: "float",
  state: "string",
  host: "string",
  timestamp: "fixed64",
});

module.exports = { declare, Message };
