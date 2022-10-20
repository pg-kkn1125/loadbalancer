/**
 * Protobuf 메세지 클래스 설정
 */
import protobuf from "protobufjs";
let isExecute = false;
class Message {
  #message = null;

  constructor() {
    this.initializeFields();
  }

  static encode(result) {
    if (result) return protobuf.Message.encode(result);
    return protobuf.Message.encode(this);
  }

  static decode(data) {
    return protobuf.Message.decode(data);
  }

  initializeFields() {
    if (isExecute) return;
    /**
     * Protobuf 규격 초기화
     */
    protobuf.Field.d(
      1,
      "fixed32",
      "required"
    )(protobuf.Message.prototype, "id");
    protobuf.Field.d(2, "float", "required")(protobuf.Message.prototype, "pox");
    protobuf.Field.d(3, "float", "required")(protobuf.Message.prototype, "poy");
    protobuf.Field.d(4, "float", "required")(protobuf.Message.prototype, "poz");
    protobuf.Field.d(
      5,
      "sfixed32",
      "required"
    )(protobuf.Message.prototype, "roy");
    
    isExecute = true;
  }

  static setMessage(properties) {
    return new protobuf.Message(properties);
  }
}

new Message();

export { Message };
