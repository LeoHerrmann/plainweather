// Fetching and displaying weather data



var weather = {
    api_key: "735430d74c0c6531f87d99a95fa80d68",

    search: async function() {
        var search_location = document.getElementById("location_input").value;

        var weather_info = await weather.fetch_weather_info(search_location);
        weather.display_weather_info(weather_info);
    },


    fetch_weather_info: async function(city_name) {
        var current_weather = await get_current_weather(city_name);
        var forecast = await get_forecast(current_weather.coord);

        var response = {
            "current": current_weather,
            "hourly": forecast.hourly,
            "daily": forecast.daily
        };

        return response;


        async function get_current_weather(city_name) {
            let current_res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city_name
            }&appid=${weather.api_key}&units=metric&lang=${translator.language}`);

            if (current_res.ok) {
                var current_weather = await current_res.json();
                return current_weather;
            }

            else {
                // alert?
                console.log("HTTP-Error: " + current_res.status);
            }
        }


        async function get_forecast(coordinates) {
            let response = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${coordinates.lat
            }&lon=${coordinates.lon}&exclude=current,minutely&appid=${weather.api_key}&units=metric&lang=${translator.language}`);

            if (response.ok) {
                var forecast = await response.json();
                return forecast;
            }

            else {
                console.log("HTTP-Error: " + response.status);
            }
        }
    },


    display_weather_info : function(weather_info) {
        display_current_weather(weather_info.current);
        display_hourly_forecast(weather_info.hourly);
        display_daily_forecast(weather_info.daily);


        function display_current_weather(weather) {
            var location = weather["name"];

            var temperature = Math.round(weather.main.temp) + "°";
            var description = weather.weather[0].description;
            var weather_code = weather.weather[0].id;
            var wind_speed = weather.wind.speed + " m / s";
            var wind_direction = weather.wind.deg + "deg";
            var pressure = weather.main.pressure + " hPa";
            var humidity = weather.main.humidity + " %";

            var precipitation = function() {
                var result = 0;

                if (typeof weather.rain != "undefined") {
                    result += weather.rain["1h"];
                }

                if (typeof weather.snow != "undefined") {
                    result += weather.snow["1h"];
                }

                return result + " mm";
            }();

            locations.current_location = location
            locations.refresh_favorite_button();

            document.getElementById("current_location_label").innerText = location;
            document.getElementById("current_temperature_label").innerText = temperature;
            document.getElementById("current_weather_label").innerText = description;
            document.getElementById("current_weather_icon").classList = `wi wi-owm-${weather_code}`;
            document.getElementById("current_wind_speed_label").innerText = wind_speed;
            document.getElementById("current_wind_direction_label").style.transform = `rotate(${wind_direction})`;
            document.getElementById("current_humidity_label").innerText = humidity;
            document.getElementById("current_pressure_label").innerText = pressure;
            document.getElementById("current_precipitation_label").innerText = precipitation;
        }


        async function display_hourly_forecast(hourly_forecast) {
            var short_forecast_data = [];
            var times = [];
            var temperatures = [];

            precipitations = [];

            var pointStyles = [];

            for (let i = 0; i < hourly_forecast.length; i++) {
                var time = new Date(parseInt(hourly_forecast[i].dt.toString() + "000"));
                var temperature = hourly_forecast[i].temp;
                var weather = hourly_forecast[i].weather[0].id;
                var description = hourly_forecast[i].weather[0].description

                if ((i + 3) % 6 == 0) {
                    let weather_canvas = generate_canvas_from_weather(weather);
                    pointStyles.push(weather_canvas);
                }
                else {
                    pointStyles.push("circle");
                }

                /*var precipitation = function() {
                    var result = 0;

                    if (typeof hourly_forecast[i].rain != "undefined") {
                        result += hourly_forecast[i].rain["1h"];
                    }

                    if (typeof hourly_forecast[i].snow != "undefined") {
                        result += hourly_forecast[i].snow["1h"];
                    }

                    return result;
                }();*/

                short_forecast_data.push({"x": time, "y": temperature, "description": description});
                //precipitations.push({"x": time, "y": precipitation});
            }

            hourly_forecast_chart.data.datasets[0].pointStyle = pointStyles;
            hourly_forecast_chart.data.datasets[0].data = short_forecast_data;
            hourly_forecast_chart.update();


            function generate_canvas_from_weather(weather_id) {
                var icon_code = icon_map[`wi_owm_${weather_id}`];

                var canvas = document.createElement("canvas");
                canvas.width = 25;
                canvas.height = 25;

                var context = canvas.getContext("2d");
                context.fillStyle = "hsl(185, 25%, 30%)";

                context.beginPath();
                context.arc(12.5, 12.5, 12.5, 0, 2 * Math.PI);
                context.fill();

                context.fillStyle = "#FFFFFF";
                context.font = "14px weathericons";
                context.fillText(icon_code, 5, 18);

                return canvas;
            }
        }


        function display_daily_forecast(daily_forecast) {
            var dates = [];
            var min_temps = [];
            var max_temps = [];
            var weather_ids = [];

            var min_min_temp;
            var max_max_temp;

            for (let day of daily_forecast) {
                dates.push(new Date(parseInt(day.dt.toString() + "000")));
                min_temps.push(Math.round(day.temp.min));
                max_temps.push(Math.round(day.temp.max));
                weather_ids.push(day.weather[0].id);
            }

            //determinen lowest and highest temperatures of dataset
            min_min_temp = min_temps[0];
            max_max_temp = max_temps[0];

            for (let min_temp of min_temps) {
                if (min_temp < min_min_temp) {
                    min_min_temp = min_temp;
                }
            }

            for (let max_temp of max_temps) {
                if (max_temp > max_max_temp) {
                    max_max_temp = max_temp;
                }
            }

            //display
            var daily_forecast_container = document.getElementById("daily_forecast_container");
            var weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
            var day_labels = daily_forecast_container.getElementsByClassName("day_label");
            var weather_icons = daily_forecast_container.getElementsByClassName("weather_icon");
            var temperature_span_bars = daily_forecast_container.getElementsByClassName("temperature_span_bar");

            for (let i = 0; i < dates.length; i++) {
                day_labels[i].innerText = function() {
                    if (i > 0) {
                        return translator.translate_key(weekdays[dates[i].getDay()], translator.language);
                    }

                    return translator.translate_key("today", translator.language);
                }();

                weather_icons[i].classList = `weather_icon wi wi-owm-${weather_ids[i]}`;
                temperature_span_bars[i].innerHTML = `<span>${min_temps[i]}</span><span style="float: right;">${max_temps[i]}</span>`
                temperature_span_bars[i].style.left = `${(min_temps[i] - min_min_temp) / (max_max_temp - min_min_temp) * 100}%`;
                temperature_span_bars[i].style.width = `${(max_temps[i] - min_temps[i]) / (max_max_temp - min_min_temp) * 100}%`;
            }
        }
    }
};
