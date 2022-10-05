/**
 * 이벤트 에미터 생성
 */
const events = require("node:events");
const emitter = new events.EventEmitter();

module.exports = emitter;
