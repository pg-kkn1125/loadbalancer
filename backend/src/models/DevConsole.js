class DevConsole {
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
