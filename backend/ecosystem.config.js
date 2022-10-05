/**
 * 공통 속성
 */
const envOptions = {
  env: {
    // 실행 시 환경 변수 설정
    HOST: "0.0.0.0",
    PORT: 3000,
  },
  env_production: {
    // 개발 환경별 환경 변수 설정
    NODE_ENV: "production",
  },
  env_development: {
    // 개발 환경별 환경 변수 설정
    NODE_ENV: "development",
  },
};
const watchOptions = {
  watch: true, // watch 여부
  // watch: ["server", "client"], // 감시할 폴더 설정
  // watch_delay: 1000, watch 딜레이 인터벌
  ignore_watch: ["node_modules"], // watch 제외 대상
};
const statusOptions = {
  max_memory_restart: "300M", // process memory가 300mb에 도달하면 reload 실행
  // wait_ready: true, // 마스터 프로세스에게 ready 이벤트를 기다리라는 의미
  // listen_timeout: 50000, // ready 이벤트를 기다릴 시간값(ms)을 의미
  // kill_timeout: 5000, // 새로운 요청을 더 이상 받지 않고 연결되어 있는 요청이 완료된 후 해당 프로세스를 강제로 종료하도록 처리
};
const instanceOptions = {
  instances: 1,
  // exec_mode: 'cluster'
};

/**
 * 채팅서버 세팅
 */
const chat = {
  script: "./src/workers/chat.js",
  watch: ["./src/workers"],
  instanceOptions,
  envOptions,
  watchOptions,
  statusOptions,
};

/**
 * 서버 세팅
 */
const SERVER_AMOUNT = 1;
const servers = new Array(SERVER_AMOUNT).fill(0).map((e, index) => ({
  script: `./src/workers/server${index}.js`,
  watch: ["./src/workers"],
  instanceOptions,
  envOptions,
  watchOptions,
  statusOptions,
}));

/**
 * 리시브 서버 세팅
 */
const receive = {
  script: "src/app.js",
  watch: "./src",
  instanceOptions,
  envOptions,
  watchOptions,
  statusOptions,
};

/**
 * 프로덕션 옵션 세팅
 */
const production = {
  user: "SSH_USERNAME",
  host: "SSH_HOSTMACHINE",
  ref: "origin/master",
  repo: "GIT_REPOSITORY",
  path: "DESTINATION_PATH",
  "pre-deploy-local": "",
  "post-deploy":
    "npm install && pm2 reload ecosystem.config.js --env production",
  "pre-setup": "",
};

module.exports = {
  apps: [chat, ...servers, receive],

  deploy: {
    production: production,
  },
};
