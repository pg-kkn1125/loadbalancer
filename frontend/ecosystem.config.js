module.exports = {
  apps: [
    {
      script: "test-jj.js",
      watch: ".",
      instances: 1,
      increment_var: "TRY",
      env: {
        MIN: 2,
        TRY: 0,
      },
    },
  ],

  deploy: {
    production: {
      user: "SSH_USERNAME",
      host: "SSH_HOSTMACHINE",
      ref: "origin/master",
      repo: "GIT_REPOSITORY",
      path: "DESTINATION_PATH",
      "pre-deploy-local": "",
      "post-deploy":
        "npm install && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
    },
  },
};
