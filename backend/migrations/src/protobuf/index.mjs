/**
 * Protobuf 메세지 클래스 설정
 */
const protobuf = require("protobufjs");

class Message {
  #message = null;

  constructor(properties) {
    this.initializeFields(properties);
  }

  static encode(result) {
    if (result) return protobuf.Message.encode(result);
    return protobuf.Message.encode(this);
  }

  static decode(data) {
    return protobuf.Message.decode(data);
  }

  initializeFields(fieldsProperties) {
    const entries = Object.entries(fieldsProperties);
    for (let idx in entries) {
      const [key, type] = entries[idx];
      const declare = protobuf.Field.d(Number(idx), type, "optional");
      declare(protobuf.Message.prototype, key);
    }
  }

  setMessage(properties) {
    this.#message = new protobuf.Message(properties);
    return this.#message;
  }
}

/**
 * Protobuf 규격 초기화
 */
const declareProtobuf = new Message({
  id: "string",
  type: "string",
  // nickname: "string",
  device: "string",
  deviceID: "fixed32",
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

module.exports = { declareProtobuf, Message };
