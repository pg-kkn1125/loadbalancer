/**
 * 이벤트 에미터 생성
 */
import EventEmitter from "events";
// https://www.huskyhoochu.com/nodejs-eventemitter/ - Emitter의 원리
// https://blog.logrocket.com/how-build-custom-node-js-event-emitters/ - Emitter의 원리
// https://stackoverflow.com/questions/12232500/custom-events-in-node-js-with-express-framework - Emitter 용법
var emitter = new EventEmitter();

export { /* cloudWs, cloudApp, sockets, */ emitter };
