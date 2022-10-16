const pm2 = require("pm2");

/**
 * 공통 속성
 */
const envOptions = {
  env: {
    // 실행 시 환경 변수 설정
    HOST: "localhost",
    PORT: 4000,
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

/**
 * 채팅서버 세팅
 */
const chat = {
  name: "chat",
  script: "./workers/chat.js",
  watch: ["./workers"],
  node_args: '-r esm',
  instances: 1,
  ...envOptions,
  ...watchOptions,
  ...statusOptions,
};

/**
 * 서버 세팅
 */
const SERVER_MAX_AMOUNT = 1;
const server = {
  name: `server`,
  script: `./workers/server.js`,
  watch: ["./workers"],
  node_args: '-r esm',
  wait_ready: true,
  instances: SERVER_MAX_AMOUNT,
  increment_var: "SERVER_PID",
  ...{
    ...Object.assign(envOptions, {
      env: {
        ...envOptions.env,
        SERVER_NAME: `server`,
        SERVER_PID: 2,
      },
    }),
  },
  ...watchOptions,
  ...statusOptions,
};

// const generateServer = (amount) =>
//   new Array(amount).fill(0).map((a, i) => server(i));

// const startServers = (amount) =>
//   generateServer(amount).forEach((server) => {
//     pm2.start(server, controlFn(server.name));
//   });

/**
 * 리시브 서버 세팅
 */
const receive = {
  name: "app", // 앱 이름
  script: "./app.js",
  watch: true,
  node_args: '-r esm',
  wait_ready: true,
  restart_delay: 1000,
  instances: 1,
  ...envOptions,
  ...watchOptions,
  ...statusOptions,
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

// pm2.connect(function (err) {
//   if (err) {
//     console.log(err);
//     process.exit(2);
//   }

//   setTimeout(() => {
//     pm2.start(receive, controlFn("app"));
//     setTimeout(() => {
//       pm2.start(chat, controlFn("chat"));
//       setTimeout(() => {
//         pm2.start(server, controlFn("server"));
//       }, 100);
//     }, 10);
//   }, 10);
// });

// function controlFn(name) {
//   return function (err, apps) {
//     if (err) {
//       console.log(err);
//       return pm2.disconnect();
//     }

//     pm2.list((err, list) => {
//       // console.log(err, list);

//       pm2.restart(name, (err, proc) => {
//         pm2.disconnect();
//       });
//     });
//   };
// }

module.exports = {
  apps: [receive, chat, server],
  deploy: {
    production: production,
  },
};
