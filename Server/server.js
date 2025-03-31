require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");
const cors = require("cors");
const moment = require("moment-timezone");
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

// Hàm lấy dữ liệu thời tiết từ OpenWeatherMap
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
    const data = response.data;

    // Xử lý thời gian theo múi giờ của thành phố
    const now = data.location.tz_id;
    const localTime = moment().tz(now).format("YYYY-MM-DD HH:mm:ss");

    // Thêm thời gian vào dữ liệu gửi về client
    data.localTime = localTime;

    return data;
  } catch (error) {
    console.error("Lỗi lấy dữ liệu thời tiết:", error.message);
    // socket.emit("error", "Không thể lấy dữ liệu thời tiết!");
    return null;
  }
};

io.on("connection", (socket) => {
  console.log("✅ Client kết nối:", socket.id);

  let interval = null; // Lưu interval để dừng khi tìm kiếm mới

  // Nhận yêu cầu lấy thông tin thời tiết hiện tại
  socket.on("getWeather", async (city) => {
    console.log(`🌎 Nhận yêu cầu thời tiết cho: ${city}`);

    // Dừng interval cũ nếu có
    if (interval) {
      clearInterval(interval);
      console.log("🛑 Dừng cập nhật cũ!");
    }

    // Lấy dữ liệu thời tiết lần đầu tiên
    const weatherData = await fetchWeatherData(city);
    if (!weatherData) {
      console.log("❌ Lỗi: Không thể lấy dữ liệu thời tiết!");
      socket.emit("error", "Không thể lấy dữ liệu thời tiết!");
      return;
    }

    // Gửi dữ liệu thời tiết về client
    console.log("✅ Gửi dữ liệu thời tiết về client.");
    socket.emit("weatherData", weatherData);
    // socket.emit("weatherData", weatherData.localTime);

    // Bắt đầu cập nhật mỗi 3 phút
    interval = setInterval(async () => {
      console.log("🔄 Cập nhật thời tiết cho:", city);
      const updatedWeather = await fetchWeatherData(city);
      if (updatedWeather) {
        socket.emit("weatherData", updatedWeather);
      }
    }, 180000); // 3 phút
  });

  // Sự kiện ngắt kết nối
  socket.on("disconnect", () => {
    console.log("❌ Client ngắt kết nối:", socket.id);
    if (interval) {
      clearInterval(interval); // Dừng cập nhật khi client ngắt kết nối
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});
