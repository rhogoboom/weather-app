import { fromUnixTime } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import "./style.css";

const weatherApp = {
  init: function () {
    this.getWeather("Rockville, Maryland");
    this.DOMCache.searchBar.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.getWeather(
          this.DOMCache.searchBar.value,
          this.currentSearch.units
        );
        this.DOMCache.searchBar.value = "";
      }
    });
    this.DOMCache.unitToggle.addEventListener("click", () => {
      this.toggleUnits();
    });
    this.DOMCache.hourlyButton.addEventListener("click", () => {
      this.DOMCache.dailyDiv.style.display = "none";
      this.DOMCache.hourlyDiv.style.display = "flex";
      this.DOMCache.arrowsDiv.style.display = "flex";
      const activeDot = document.querySelector(".active-dot");
      this.hourliesToggle(activeDot);
    });
    this.DOMCache.dailyButton.addEventListener("click", () => {
      this.DOMCache.dailyDiv.style.display = "flex";
      this.DOMCache.hourlyDiv.style.display = "none";
      this.DOMCache.arrowsDiv.style.display = "none";
    });
    this.DOMCache.dots.forEach((dot) => {
      dot.addEventListener("click", (e) => {
        const target = e.target;
        const tag = e.target.dataset.tag;
        if (target.classList.contains("active-dot")) {
          return;
        }
        const previouslyActive = document.querySelector(".active-dot");
        previouslyActive.classList.remove("active-dot");
        target.classList.add("active-dot");
        this.hourliesToggle(target);
      });
    });
    this.DOMCache.leftArrow.addEventListener("click", () => {
      const previouslyActive = document.querySelector(".active-dot");
      if (previouslyActive.dataset.tag === "1") {
        return;
      }
      const newActive = previouslyActive.previousElementSibling;
      previouslyActive.classList.remove("active-dot");
      newActive.classList.add("active-dot");
      this.hourliesToggle(newActive);
    });
    this.DOMCache.rightArrow.addEventListener("click", () => {
      const previouslyActive = document.querySelector(".active-dot");
      if (previouslyActive.dataset.tag === "3") {
        return;
      }
      const newActive = previouslyActive.nextElementSibling;
      previouslyActive.classList.remove("active-dot");
      newActive.classList.add("active-dot");
      this.hourliesToggle(newActive);
    });
  },
  apiKey: "ed9a58b1f19f8e2120a326ae399b692a",
  getGeocode: async function (location) {
    const response = await fetch(
      `http://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${this.apiKey}`,
      { mode: "cors" }
    );
    const locationData = await response.json();
    this.currentSearch.city = locationData[0].name;
    this.currentSearch.state = locationData[0].state;
    this.currentSearch.country = locationData[0].country;
    this.currentSearch.searchString = location;
    const { lon, lat } = locationData[0];
    return [lon, lat];
  },
  getWeather: async function (location, units = "imperial") {
    const [lon, lat] = await this.getGeocode(location);
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=${units}&appid=ed9a58b1f19f8e2120a326ae399b692a`,
      { mode: "cors" }
    );
    const weatherData = await response.json();
    this.displayWeather(weatherData);
    return weatherData;
  },
  currentSearch: {
    city: "Rockville",
    state: "Maryland",
    country: "United States",
    units: "imperial",
    searchString: "Rockville, Maryland",
  },
  DOMCache: {
    weatherDescription: document.querySelector("#weather-description"),
    currentLocation: document.querySelector("#current-location"),
    currentDate: document.querySelector("#current-date"),
    currentTime: document.querySelector("#current-time"),
    currentTemp: document.querySelector("#current-temp"),
    currentIcon: document.querySelector("#current-weather-symbol"),
    feelsLike: document.querySelector("#feels-like"),
    humidity: document.querySelector("#humidity"),
    rainChance: document.querySelector("#rain-chance"),
    windSpeed: document.querySelector("#wind-speed"),
    searchBar: document.querySelector("#search"),
    unitToggle: document.querySelector("#unit-toggle"),
    dailyDiv: document.querySelector("#dailies"),
    hourlyDiv: document.querySelector("#hourlies"),
    arrowsDiv: document.querySelector(".arrow-buttons"),
    dailies: [...document.querySelectorAll(".daily")],
    hourlies: [...document.querySelectorAll(".hour")],
    dailyButton: document.querySelector("#daily-button"),
    hourlyButton: document.querySelector("#hourly-button"),
    dots: [...document.querySelectorAll(".dot")],
    leftArrow: document.querySelector("#left-arrow"),
    rightArrow: document.querySelector("#right-arrow"),
  },
  displayWeather: function (data) {
    this.displayCurrent(data);
    this.displayDailies(data);
    this.displayHourlies(data);
  },
  displayCurrent: function (data) {
    const { icon, description } = data.current.weather[0];
    const {
      temp,
      feels_like: feelsLike,
      humidity,
      wind_speed: windSpeed,
    } = data.current;
    const { pop: rainChance } = data.daily[0];
    const today = fromUnixTime(data.current.dt);
    const { timezone } = data;
    this.DOMCache.weatherDescription.innerText = description;
    this.DOMCache.currentLocation.innerText = `${this.currentSearch.city}, ${
      this.currentSearch.state !== undefined
        ? this.currentSearch.state
        : this.currentSearch.country
    }`;
    this.DOMCache.currentDate.innerText = formatInTimeZone(
      today,
      timezone,
      "PPPP"
    );
    this.DOMCache.currentTime.innerText = formatInTimeZone(
      today,
      timezone,
      "p"
    );
    this.DOMCache.currentTemp.innerText = this.formatTemp(temp);
    this.DOMCache.currentIcon.src = `http://openweathermap.org/img/wn/${icon}@2x.png`;
    this.DOMCache.feelsLike.innerText = this.formatTemp(feelsLike);
    this.DOMCache.humidity.innerText = `${humidity}%`;
    this.DOMCache.rainChance.innerText = `${rainChance}%`;
    this.DOMCache.windSpeed.innerText = `${windSpeed} ${
      this.currentSearch.units === "imperial" ? "mph" : "kph"
    }`;
  },
  displayDailies: function (data) {
    for (let i = 0; i < 7; i++) {
      const children = this.DOMCache.dailies[i].children;
      const day = formatInTimeZone(
        fromUnixTime(data.daily[i + 1].dt),
        data.timezone,
        "eeee"
      );
      const { max: high, min: low } = data.daily[i + 1].temp;
      const { icon } = data.daily[i + 1].weather[0];
      children[0].textContent = day;
      children[1].textContent = this.formatTemp(high);
      children[2].textContent = this.formatTemp(low);
      children[3].src = `http://openweathermap.org/img/wn/${icon}@2x.png`;
    }
  },
  displayHourlies: function (data) {
    for (let i = 0; i < 21; i++) {
      const children = this.DOMCache.hourlies[i].children;
      const hour = formatInTimeZone(
        fromUnixTime(data.hourly[i + 1].dt),
        data.timezone,
        "h b"
      );
      const { temp } = data.hourly[i + 1];
      const { icon } = data.hourly[i + 1].weather[0];
      children[0].textContent = hour;
      children[1].textContent = this.formatTemp(temp);
      children[2].src = `http://openweathermap.org/img/wn/${icon}@2x.png`;
    }
  },
  toggleUnits: function () {
    this.currentSearch.units =
      this.currentSearch.units === "imperial" ? "metric" : "imperial";
    this.getWeather(this.currentSearch.searchString, this.currentSearch.units);
  },
  formatTemp: function (num) {
    return `${Math.round(num)} \u00B0${
      this.currentSearch.units === "imperial" ? "F" : "C"
    }`;
  },
  hourliesToggle: function (activeDot) {
    this.DOMCache.hourlies.forEach((hour) => {
      if (hour.dataset.tag === activeDot.dataset.tag) {
        hour.style.display = "flex";
      } else {
        hour.style.display = "none";
      }
    });
  },
};

weatherApp.init();
