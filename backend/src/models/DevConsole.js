class DevConsole {
  #visible = true;
  toggleVisible() {
    this.#visible = !this.#visible;
    console.log(this.#visible?'로그가 켜졌습니다.':'로그가 꺼졌습니다.')
  }
  assert(condition, ...data) {
    console.assert(condition, ...data);
  }
  log(...data) {
    console.log(`[DEV]:`, ...(data.length === 0 ? ["nothing"] : data));
  }
  debug(...data) {
    console.debug(`[DEV]:`, ...(data.length === 0 ? ["nothing"] : data));
  }
  error(...data) {
    console.error(`[DEV]:`, ...(data.length === 0 ? ["nothing"] : data));
  }
  warn(...data) {
    console.warn(`[DEV]:`, ...(data.length === 0 ? ["nothing"] : data));
  }
  time(label) {
    console.time(label);
  }
  timeEnd(label) {
    console.timeEnd(label);
  }
}

const dev = new DevConsole();

export default dev;
