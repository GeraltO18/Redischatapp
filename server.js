const express = require("express");
const path = require("path");
const redisClient = require("./redisdb");

const app = express();
var http = require("http").createServer(app);
var io = require("socket.io")(http);

app.get("/", (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

app.use(express.static("uploads"));

io.on("connection", (socket) => {
  socket.on("disconnect", async () => {
    console.log(`${socket.name} disconnected!`);
    io.emit("leave", socket.name);
    await redisClient.delAsync(`socketIdFor-${socket.name}`);
  });

  socket.on("join", async (name) => {
    console.log(`${name} joined!`);
    socket.name = name;
    io.emit("join", name);
    await redisClient.setAsync(`socketIdFor-${name}`, socket.id);
  });

  socket.on("chat", (data) => {
    console.log(`chat data: ${JSON.stringify(data, null, 2)}`);
    io.emit("chat", data);
  });

  socket.on("start-type", (name, cb) => {
    console.log(`${name} started to type`);
    socket.broadcast.emit("start-type", name);
    cb();
  });

  socket.on("stop-type", (name, cb) => {
    console.log(`${name} stopped typing`);
    socket.broadcast.emit("stop-type", name);
    cb();
  });
});

http.listen(3000, () => {
  console.log("> http://localhost:3000");
});
