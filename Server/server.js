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

app.use(cors());

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_URL = "https://api.weatherapi.com/v1/forecast.json";

// Hàm lấy dữ liệu thời tiết
const fetchWeatherData = async (city) => {
  try {
    const response = await axios.get(WEATHER_API_URL, {
      params: {
        key: WEATHER_API_KEY,
        q: city,
        days: 5,
        aqi: "yes",
        alerts: "yes",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi lấy dữ liệu thời tiết:", error.message);
    // socket.emit("error", "Không thể lấy dữ liệu thời tiết!");
    return null;
  }
};

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
