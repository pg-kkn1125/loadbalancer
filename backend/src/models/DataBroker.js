import pm2 from "pm2";

const Broker = () => ({
  emit(pid, target, data) {
    const packet = {
      topic: true,
      type: "process:msg",
      data: {
        target,
        packet: data,
      },
    };
    pm2.sendDataToProcessId(pid, packet, (err) => {
      //
    });
  },
});

export default Broker(pm2);
