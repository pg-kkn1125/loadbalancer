const Queue = require("../models/Queue.mjs");

const chatQueue = new Queue();

process.send("ready");
