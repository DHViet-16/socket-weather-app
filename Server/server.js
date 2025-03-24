require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Client kết nối:", socket.id);

  socket.on("getWeather", async (city) => {
    const weatherData = await fetchWeatherData(city);
    if (weatherData) {
      socket.emit("weatherData", weatherData);
    } else {
      socket.emit("error", "Không thể lấy dữ liệu thời tiết!");
    }
  });

  socket.on("disconnect", () => {
    console.log("Client ngắt kết nối:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});
