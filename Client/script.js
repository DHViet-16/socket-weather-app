const socket = io("http://localhost:3000");

const cityInput = document.querySelector(".city-input");
const searchBtn = document.querySelector(".search-btn");

const notFoundSection = document.querySelector(".not-found");
const searchCitySection = document.querySelector(".search-city");
const weatherInfoSection = document.querySelector(".weather-info");

const countryTxt = document.querySelector(".country-txt");
const tempTxt = document.querySelector(".temp-txt");
const conditionTxt = document.querySelector(".condition-txt");
const humidityValueTxt = document.querySelector(".humidity-value-txt");
const windValueTxt = document.querySelector(".wind-value-txt");
const weatherSummaryImg = document.querySelector(".weather-summary-img");
const currentDateTxt = document.querySelector(".current-date-txt");

const forecastItemsContainer = document.querySelector(
  ".forecast-items-container"
);
const forecastItemsTomorrowContainer = document.querySelector(
  ".forecast-tomorrow-items-container"
);

const minTemp = document.querySelector(".min-temp");
const maxTemp = document.querySelector(".max-temp");
const feelslike = document.querySelector(".feelslike-temp");
const uvText = document.querySelector(".uv");
const pressure = document.querySelector(".pressure");
const vision = document.querySelector(".vision");

const sunInfo = document.querySelector(".sun-info");
const sunInfoTime = document.querySelector(".sun-info-time");
const nightMode = document.querySelector(".night-mode");
const sunriseTime = document.querySelector(".sunrise .sunrise-time");
const sunsetTime = document.querySelector(".sunset .sunset-time");

const moonIcon = document.querySelector(".moon-icon");
const sunIcon = document.querySelector(".sun-icon");
//
// Khi trang tải xong, tự động lấy vị trí người dùng
document.addEventListener("DOMContentLoaded", () => {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const locationString = `${latitude},${longitude}`;
        socket.emit("getWeather", locationString);
      },
      (error) => {
        console.error("Lỗi khi lấy vị trí:", error.message);
      }
    );
  } else {
    alert("Trình duyệt không hỗ trợ Geolocation.");
  }
});

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
  updateBg(data);
  changeSunset(data);
  updateProgressBar(data);
});
// Hàm xử lý thời gian hiện tại, thời gian hoàng hôn, bình minh,
function handleDateAndTime(data) {
  const now = convertTimeLocal(data.location.localtime); // lấy thời gian hiện tại của mỗi khu vực
  let currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  // console.log(typeof currentHour);
  const forecastDays = data.forecast.forecastday;
  const sunriseToday = forecastDays[0]?.astro?.sunrise.replace(/ AM| PM/, "");
  const sunriseTodayHours = parseInt(sunriseToday.split(":")[0]);
  // console.log(typeof sunriseTodayHours);
  const sunriseTodayMinute = parseInt(sunriseToday.split(":")[1]);
  const sunriseTomorrow = forecastDays[1]?.astro?.sunrise.replace(
    / AM| PM/,
    ""
  );
  const sunriseTomorrowHours = parseInt(sunriseTomorrow.split(":")[0]);
  const sunriseTomorrowMinute = parseInt(sunriseTomorrow.split(":")[1]);
  const sunsetToday = convert24H(forecastDays[0]?.astro?.sunset); // chuuyển đổi AM PM : 6PM thành 18AM
  const sunsetTodayHour = parseInt(sunsetToday.split(":")[0]);
  // console.log(typeof sunsetTodayHour);
  const sunsetTodayMinute = parseInt(sunsetToday.split(":")[1]);

  return {
    now,
    forecastDays,
    currentHour,
    currentMinute,
    sunriseTodayHours,
    sunriseTodayMinute,
    sunriseTomorrowHours,
    sunriseTomorrowMinute,
    sunsetTodayHour,
    sunsetTodayMinute,
    sunsetToday,
    sunriseTomorrow,
    sunriseToday,
  };
}
//  // lấy thời gian hiện tại của mỗi khu vực
function convertTimeLocal(time) {
  return new Date(time.replace(" ", "T"));
}
// chuyển đổi AM PM : 6PM thành 18AM
function convert24H(time) {
  timeconvert = time.replace(
    /(\d{1,2}):(\d{2}) (AM|PM)/,
    (match, h, m, period) =>
      `${
        period === "PM" && h !== "12"
          ? +h + 12
          : period === "AM" && h === "12"
          ? "00"
          : h
      }:${m}`
  );
  return timeconvert;
}
//
// Hàm chuyển đổi background giữa ban ngày và ban đên dựa vào thời gian hoàng hôn bình minh
function updateBg(data) {
  const bgChangeTime = handleDateAndTime(data);
  if (
    (bgChangeTime.currentHour > bgChangeTime.sunriseTodayHours ||
      (bgChangeTime.currentHour === bgChangeTime.sunriseTodayHours &&
        bgChangeTime.currentMinute >= bgChangeTime.sunriseTodayMinute)) &&
    (bgChangeTime.currentHour < bgChangeTime.sunsetTodayHour ||
      (bgChangeTime.currentHour === bgChangeTime.sunsetTodayHour &&
        bgChangeTime.currentMinute <= bgChangeTime.sunsetTodayMinute))
  ) {
    // console.log(hours, hoursSunset);
    document.body.style.backgroundImage = `url("../assets/bg.jpg")`;
  } else {
    // console.log(hours, hoursSunset);
    document.body.style.backgroundImage = `url("../assets/bg-night.png")`;
  }
}

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
// dự báo thời tiết những ngày tiếp theo
function updateForecastsTomorrowItems(forecastWeather) {
  const {
    time,
    uv,
    wind_kph,
    humidity,
    temp_c,
    condition: { icon, text },
  } = forecastWeather;
  // console.log(forecastWeather);
  const dateTaken = new Date(time);
  const dateOption = {
    day: "2-digit",

    month: "short",
    // hour: "2-digit",
  };
  const dateResult = dateTaken.toLocaleDateString("en-US", dateOption);

  const forecastTomorrowItem = `
  <div class="forecast-tomorrow-items">
            <div class="forecast-tomomorrrow-items-display">
              <h5 class="forecast-tomorrow-items-date regular-txt">${dateResult}</h5>
              <img
                src="https://${icon}"
          class="forecast-tomorrow-items-img"
                class="forecast-tomorrow-items-img"
              />
              <h5 class="forecast-item-temp">${Math.round(temp_c)} °C</h5>
            </div>
            <div class="forecast-tomorrow-items-hidden" >
              <div class="detail-hidden">
                <h5 class="detail-title regular-txt" >Desc :</h5>
                <h5 class="detail-value regular-txt"><strong>${text}</strong></h5>
              </div>
              <div class="detail-hidden">
                <h5 class="detail-title regular-txt" >UV :</h5>
                <h5 class="detail-value regular-txt"><strong>${Math.round(
                  uv
                )}</strong></h5>
              </div>
              <div class="detail-hidden">
                <h5 class="detail-title regular-txt">Wind Speed :</h5>
                <h5 class="detail-value regular-txt"><strong>${Math.round(
                  wind_kph
                )}</strong> Km/h</h5>
              </div>
              <div class="detail-hidden">
                <h5 class="detail-title regular-txt">Humidity :</h5>
                <h5 class="detail-value regular-txt"><strong>${Math.round(
                  humidity
                )}</strong> %</h5>
              </div>
            </div>
          </div>
 `;
  forecastItemsTomorrowContainer.insertAdjacentHTML(
    "beforeend",
    forecastTomorrowItem
  );
  const lastAddedItem = forecastItemsTomorrowContainer.lastElementChild;
  console.log(lastAddedItem);
  const displayDiv = lastAddedItem.querySelector(
    ".forecast-tomomorrrow-items-display"
  );
  const hiddenDiv = lastAddedItem.querySelector(
    ".forecast-tomorrow-items-hidden"
  );

  displayDiv.addEventListener("click", function () {
    // thêm sự kiện khi ấn vào dự báo những ngày tiếp theo
    hiddenDiv.classList.toggle("active");
  });
}
function changeSunset(data) {
  console.log(data);
  const swapTime = handleDateAndTime(data);

  if (
    (swapTime.currentHour > swapTime.sunriseTodayHours ||
      (swapTime.currentHour === swapTime.sunriseTodayHours && // Thời gian hiện tại nằm trong khoảng thời gian bình minh và hoàng hôn trong ngày (khi trời sáng)
        swapTime.currentMinute >= swapTime.sunriseTodayMinute)) &&
    (swapTime.currentHour < swapTime.sunsetTodayHour ||
      (swapTime.currentHour === swapTime.sunsetTodayHour &&
        swapTime.currentMinute <= swapTime.sunsetTodayMinute))
  ) {
    sunInfo.classList.remove("night-mode"); // trời sáng
    sunriseTime.textContent = swapTime.sunriseToday;
    sunsetTime.textContent = swapTime.sunsetToday;
  } else {
    sunInfo.classList.add("night-mode"); // trời tối

    sunriseTime.textContent = swapTime.sunsetToday;
    sunsetTime.textContent = swapTime.sunriseTomorrow;
    console.log(sunriseTime.textContent, sunsetTime.textContent);
  }
}
// Hàm tính toán của thanh dự báo còn bao lâu đến hoàng hôn , bình minh. Ý tưởng: chuyển về phút để tính toán.
function calculateProgress(
  currentHour,
  currentMinute,
  startHour,
  startMinute,
  endHour,
  endMinute
) {
  let totalMinutes, elapsedMinutes;
  if (currentHour >= startHour && currentHour < endHour) {
    totalMinutes = (endHour - startHour) * 60 - startMinute + endMinute;
    elapsedMinutes =
      (currentHour - startHour) * 60 + currentMinute - startMinute;
  } else {
    totalMinutes =
      (24 - startHour) * 60 - startMinute + endHour * 60 + endMinute;
    if (currentHour >= startHour) {
      if (currentHour === 0) {
        return (currentHour = 24);
      }
      elapsedMinutes =
        (currentHour - startHour) * 60 + currentMinute - startMinute;
    } else {
      elapsedMinutes =
        (24 - startHour) * 60 +
        currentMinute -
        startMinute +
        currentHour * 60 +
        currentMinute;
    }
  }

  let progressPercentage = (elapsedMinutes / totalMinutes) * 100; // số phút trôi qua / tổng số phút
  return Math.max(0, Math.min(100, progressPercentage)); // Giới hạn từ 0% đến 100%
}

function updateProgressBar(data) {
  const updateProgressTime = handleDateAndTime(data);

  if (sunInfo.className.includes("night-mode")) {
    // nếu trời tối
    let progress = calculateProgress(
      updateProgressTime.currentHour,
      updateProgressTime.currentMinute,
      updateProgressTime.sunsetTodayHour,
      updateProgressTime.sunsetTodayMinute,
      updateProgressTime.sunriseTomorrowHours,
      updateProgressTime.sunriseTomorrowMinute
    );

    sunIcon.style.display = "none";
    moonIcon.style.display = "inline-block";
    console.log(progress);
    moonIcon.style.transform = `translateX(${progress}%)`; // icon sẽ di chuyển từ trái sang phải
  } else {
    let progress = calculateProgress(
      updateProgressTime.currentHour,
      updateProgressTime.currentMinute,
      updateProgressTime.sunriseTodayHours,
      updateProgressTime.sunriseTodayMinute,
      updateProgressTime.sunsetTodayHour,
      updateProgressTime.sunsetTodayMinute
    );
    sunIcon.style.display = "inline-block";
    moonIcon.style.display = "none";
    console.log(progress);
    document.styleSheets[0].insertRule(
      `.sun-icon::after { width: calc(${100 - progress}% + 4px); }`,
      document.styleSheets[0].cssRules.length
    );
    sunIcon.style.transform = `translateX(${progress}%)`;
  }
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
