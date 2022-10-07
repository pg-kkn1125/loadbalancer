const { Message, declareProtobuf } = require("../protobuf");

class Queue {
  #channels = new Map();
  #limit = 1000;

  constructor(limit = 1000) {
    this.#limit = limit;
  }

  #selectChannel(ch) {
    if (!this.#channels.has(String(ch))) {
      this.#channels.set(String(ch), []);
    }
    return this.#channels.get(String(ch));
  }

  enter(ch, data) {
    this.#isOverflow(ch);
    const str = JSON.stringify(data);
    this.#selectChannel(ch).push(str);
  }

  get(ch) {
    return this.#selectChannel(ch).shift();
  }

  clear(ch) {
    this.#channels.set(String(ch), []);
  }

  size(ch) {
    this.#isOverflow(ch);
    return this.#selectChannel(ch).length;
  }

  #isOverflow(ch) {
    if (this.#selectChannel(ch).length > this.#limit) {
      this.get(ch);
    }
  }
}

module.exports = Queue;
