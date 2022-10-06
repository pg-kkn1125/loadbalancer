import protobuf from "protobufjs";

/**
 * Protobuf 메세지 클래스 설정
 */

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

export { Message };
