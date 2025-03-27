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
async function updateForecastsInfo(city) {
  const forecastsData = await getFetchData(city);

  if (!forecastsData || !forecastsData.forecast) {
    console.log("Dữ liệu dự báo không hợp lệ.");
    return;
  }

  const forecastDays = forecastsData.forecast.forecastday;
  const now = new Date();
  let closestForecast = null;
  let count = 0;
  // Tìm thời điểm gần nhất trong tương lai
  for (const forecastWeather of forecastDays) {
    for (const item of forecastWeather.hour) {
      const forecastTime = new Date(item.time);
      if (
        forecastTime >= now &&
        (!closestForecast || forecastTime < closestForecast)
      ) {
        closestForecast = forecastTime;
      }
    }
  }

  // Xóa nội dung cũ trước khi cập nhật
  forecastItemsContainer.innerHTML = "";
  forecastItemsTomorrowContainer.innerHTML = "";
  // Hiển thị dự báo giờ gần nhất
  forecastDays.forEach((item) => {
    item.hour.forEach((forecastWeather) => {
      const forecastTime = new Date(forecastWeather.time);
      if (forecastTime >= closestForecast && count < 10) {
        updateForecastsItems(forecastWeather);
        count++;
      }
    });
  });

  // Lọc dự báo ngày mai
  const timeTaken = "12:00";
  const todayDate = new Date().toISOString().split("T")[0];

  forecastDays.forEach((item) => {
    item.hour.forEach((forecastWeather) => {
      if (
        forecastWeather.time.includes(timeTaken) &&
        !forecastWeather.time.includes(todayDate)
      ) {
        updateForecastsTomorrowItems(forecastWeather);
      }
    });
  });
}
//  DỰ BÁO THỜI TIẾT CÁC KHOẢNG THỜI GIAN TRONG NGÀY
function updateForecastsItems(forecastWeather) {
  const {
    time,
    temp_c,
    condition: { icon },
  } = forecastWeather;

  const dateTaken = new Date(time);
  const timeResult = dateTaken.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const forecastItem = `
            <div class="forecast-item">
          <h5 class="forecast-item-date regular-txt">${timeResult}</h5>
          <img
            src="https://${icon}"
            class="forecast-item-img"
          />
          <h5 class="forecast-item-temp">${Math.round(temp_c)} °C</h5>
        </div>
  `;
  forecastItemsContainer.insertAdjacentHTML("beforeend", forecastItem);
}
//  DỰ BÁO THỜI TIẾT NGÀY MAI
function updateForecastsTomorrowItems(forecastWeather) {
  const {
    time,
    temp_c,
    condition: { icon },
  } = forecastWeather;

  const dateTaken = new Date(time);
  const dateOption = {
    day: "2-digit",

    month: "short",
    // hour: "2-digit",
  };
  const dateResult = dateTaken.toLocaleDateString("en-US", dateOption);

  const forecastTomorrowItem = `
        <div class="forecast-tomorrow-items">
        <h5 class="forecast-tomorrow-items-date regular-txt">${dateResult}</h5>
        <img
          src="https://${icon}"
          class="forecast-tomorrow-items-img"
        />
        <h5 class="forecast-item-temp">${Math.round(temp_c)} °C</h5>
      </div>
  `;
  forecastItemsTomorrowContainer.insertAdjacentHTML(
    "beforeend",
    forecastTomorrowItem
  );
}

// TÌM KIẾM THÀNH PHỐ KHÔNG CÓ SẼ HIỂN THỊ TRANG NOT FOUND
function showDisplaySection(section) {
  [weatherInfoSection, notFoundSection].forEach(
    (s) => (s.style.display = "none")
  );
  section.style.display = "flex";
}

socket.on("error", () => {
  showDisplaySection(notFoundSection);
});
