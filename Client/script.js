const socket = io("http://localhost:3000");

const cityInput = document.querySelector(".city-input");
const searchBtn = document.querySelector(".search-btn");

const notFoundSection = document.querySelector(".not-found");
const searchCitySection = document.querySelector(".search-city");
const weatherInfoSection = document.querySelector(".weather-info");

//
function removeVietnameseTones(str) {
  return str
    .normalize("NFD") // Tách dấu ra khỏi ký tự
    .replace(/[\u0300-\u036f]/g, "") // Xóa dấu
    .replace(/Đ/g, "D") // Chuyển Đ -> D
    .replace(/đ/g, "d"); // Chuyển đ -> d
}

//
function getWeather() {
  if (cityInput.value.trim() != "") {
    const normalizedCity = removeVietnameseTones(cityInput.value);
    socket.emit("getWeather", normalizedCity);
    cityInput.value = "";
    cityInput.blur();
  }
}
// Gắn sự kiện cho nút tìm kiếm
searchBtn.addEventListener("click", getWeather);

// Gắn sự kiện khi nhấn Enter
cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    getWeather();
  }
});

socket.on("weatherData", (data) => {
  if (!data) {
    socket.emit("error", "Không thể lấy dữ liệu thời tiết!");
  }
  // console.log(data);

  updateWeatherInfo(data);
});
//
function updateWeatherInfo(data) {
  showDisplaySection(weatherInfoSection);

  const {
    location: { name },
    current: {
      temp_c,
      humidity,
      wind_kph,
      feelslike_c,
      uv,
      vis_km,
      pressure_mb,
      condition: { text, icon },
    },
    forecast: {
      forecastday: [
        {
          day: { maxtemp_c, mintemp_c },
          // astro: { sunrise, sunset },
        },
      ],
    },
  } = data;

  countryTxt.textContent = name;
  tempTxt.textContent = `${Math.round(temp_c)}°C`;
  conditionTxt.textContent = text;
  humidityValueTxt.textContent = `${humidity}%`;
  windValueTxt.textContent = `${Math.round(wind_kph)} km/h`;
  weatherSummaryImg.src = `https://${icon}`;

  minTemp.innerHTML = `<strong>${mintemp_c}</strong> °`;
  feelslike.innerHTML = `<strong>${feelslike_c}</strong> °`;
  maxTemp.innerHTML = `<strong>${maxtemp_c}</strong> °`;
  uvText.innerHTML = `<strong>${uv}</strong>`;
  pressure.innerHTML = `<strong>${pressure_mb}</strong> Mb`;
  vision.innerHTML = `<strong>${vis_km}</strong> Km`;
  updateForecastsInfo(data);
}

// TÌM KIẾM THÀNH PHỐ KHÔNG CÓ SẼ HIỂN THỊ TRANG NOT FOUND
function showDisplaySection(section) {
  [weatherInfoSection, notFoundSection].forEach(
    (s) => (s.style.display = "none")
  );
  section.style.display = "flex";
}

socket.on("error", (message) => {
  console.log("❌ Lỗi nhận được từ server:", message);

  // Ẩn tất cả các phần
  showDisplaySection(notFoundSection);

  // Nếu có phần hiển thị lỗi, cập nhật nội dung
});
