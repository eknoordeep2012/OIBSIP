// ===== SMART TEMPERATURE CONVERTER =====

// HTML elements
const temperatureInput = document.getElementById("temperature");
const fromUnit = document.getElementById("fromUnit");
const toUnit = document.getElementById("toUnit");

const convertBtn = document.getElementById("convertBtn");
const clearBtn = document.getElementById("clearBtn");

const result = document.getElementById("result");
const formula = document.getElementById("formula");

const indoorTemp = document.getElementById("indoorTemp");
const indoorBtn = document.getElementById("indoorBtn");
const indoorDisplay = document.getElementById("indoorDisplay");

const outdoorDisplay = document.getElementById("outdoorDisplay");
const locationDisplay = document.getElementById("locationDisplay");
const weatherBtn = document.getElementById("weatherBtn");
const weatherStatus = document.getElementById("weatherStatus");

const comparisonResult = document.getElementById("comparisonResult");

// Temperature values
let indoorValue = null;
let outdoorValue = null;


// ===== TEMPERATURE CONVERSION =====

function convertTemperature(value, from, to) {

    let celsius;

    // Convert input into Celsius first
    if (from === "C") {
        celsius = value;
    } else if (from === "F") {
        celsius = (value - 32) * 5 / 9;
    } else {
        celsius = value - 273.15;
    }

    // Absolute zero validation
    if (celsius < -273.15) {
        return null;
    }

    // Convert Celsius into selected unit
    if (to === "C") {
        return celsius;
    } else if (to === "F") {
        return (celsius * 9 / 5) + 32;
    } else {
        return celsius + 273.15;
    }
}


// ===== FORMULA DISPLAY =====

function getFormula(from, to) {

    const formulas = {
        "C-F": "(°C × 9/5) + 32",
        "F-C": "(°F − 32) × 5/9",
        "C-K": "°C + 273.15",
        "K-C": "K − 273.15",
        "F-K": "(°F − 32) × 5/9 + 273.15",
        "K-F": "(K − 273.15) × 9/5 + 32"
    };

    if (from === to) {
        return "Same unit: No conversion required.";
    }

    return formulas[from + "-" + to];
}


// ===== CONVERT BUTTON =====

convertBtn.addEventListener("click", function () {

    const value = parseFloat(temperatureInput.value);

    if (temperatureInput.value.trim() === "" || !Number.isFinite(value)) {
        result.textContent = "Please enter a valid temperature.";
        formula.textContent = "";
        return;
    }

    const convertedValue = convertTemperature(
        value,
        fromUnit.value,
        toUnit.value
    );

    if (convertedValue === null) {
        result.textContent = "Temperature cannot be below absolute zero.";
        formula.textContent = "";
        return;
    }

    const unitSymbols = {
        C: "°C",
        F: "°F",
        K: "K"
    };

    result.textContent =
        `${value} ${unitSymbols[fromUnit.value]} = ${convertedValue.toFixed(2)} ${unitSymbols[toUnit.value]}`;

    formula.textContent =
        "Formula: " + getFormula(fromUnit.value, toUnit.value);
});


// ===== CLEAR BUTTON =====

clearBtn.addEventListener("click", function () {

    temperatureInput.value = "";

    result.textContent = "Your result will appear here";
    formula.textContent = "Conversion formula will appear here";

    fromUnit.value = "C";
    toUnit.value = "F";
});


// ===== INDOOR TEMPERATURE =====

indoorBtn.addEventListener("click", function () {

    const value = parseFloat(indoorTemp.value);

    if (indoorTemp.value.trim() === "" || !Number.isFinite(value)) {
        indoorDisplay.textContent = "Enter a valid value";
        return;
    }

    if (value < -273.15) {
        indoorDisplay.textContent = "Invalid temperature";
        return;
    }

    indoorValue = value;

    indoorDisplay.textContent = value.toFixed(1) + " °C";

    updateComparison();
});


// ===== OUTDOOR LIVE TEMPERATURE =====

weatherBtn.addEventListener("click", function () {

    if (!navigator.geolocation) {
        weatherStatus.textContent =
            "Your browser does not support location.";
        return;
    }

    weatherStatus.textContent =
        "Detecting your location... Please wait.";

    weatherBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(

        async function (position) {

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            try {

                const url =
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&timezone=auto`;

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error("Weather data unavailable");
                }

                const data = await response.json();

                const temperature =
                    data.current.temperature_2m;

                if (!Number.isFinite(temperature)) {
                    throw new Error("Invalid weather data");
                }

                outdoorValue = temperature;

                outdoorDisplay.textContent =
                    temperature.toFixed(1) + " °C";

                locationDisplay.textContent =
                    "Your current location";

                weatherStatus.textContent =
                    "Live outdoor temperature updated successfully!";

                updateComparison();

            } catch (error) {

                weatherStatus.textContent =
                    "Unable to load weather. Please try again.";

            } finally {

                weatherBtn.disabled = false;

            }
        },

        function (error) {

            if (error.code === 1) {
                weatherStatus.textContent =
                    "Location permission denied. Please allow location access.";
            } else if (error.code === 3) {
                weatherStatus.textContent =
                    "Location request timed out. Please try again.";
            } else {
                weatherStatus.textContent =
                    "Unable to detect location. Check your device settings.";
            }

            weatherBtn.disabled = false;
        },

        {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 60000
        }
    );
});


// ===== INDOOR VS OUTDOOR COMPARISON =====

function updateComparison() {

    if (indoorValue === null || outdoorValue === null) {

        comparisonResult.textContent =
            "Update both indoor and outdoor temperatures to compare.";

        drawComparisonGraph();

        return;
    }

    const difference = Math.abs(indoorValue - outdoorValue);

    if (difference < 0.05) {

        comparisonResult.textContent =
            "Indoor and outdoor temperatures are almost equal.";

    } else if (indoorValue > outdoorValue) {

        comparisonResult.textContent =
            `Indoor is warmer by ${difference.toFixed(1)} °C.`;

    } else {

        comparisonResult.textContent =
            `Outdoor is warmer by ${difference.toFixed(1)} °C.`;

    }

    drawComparisonGraph();
}


// ===== COMPARISON GRAPH =====

function drawComparisonGraph() {

    let canvas = document.getElementById("temperatureChart");

    if (!canvas) {

        canvas = document.createElement("canvas");

        canvas.id = "temperatureChart";
        canvas.height = 220;

        canvas.style.width = "100%";
        canvas.style.maxWidth = "600px";
        canvas.style.display = "block";
        canvas.style.margin = "25px auto 0";

        comparisonResult.parentElement.appendChild(canvas);
    }

    const ctx = canvas.getContext("2d");

    const width = canvas.clientWidth || 500;
    const height = 220;

    const ratio = window.devicePixelRatio || 1;

    canvas.width = width * ratio;
    canvas.height = height * ratio;

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (indoorValue === null || outdoorValue === null) {

        ctx.fillStyle = "#bdc9e7";
        ctx.font = "14px Poppins, sans-serif";
        ctx.textAlign = "center";

        ctx.fillText(
            "Update both temperatures to see the graph",
            width / 2,
            110
        );

        return;
    }

    const values = [indoorValue, outdoorValue];

    const maxValue = Math.max(
        Math.abs(indoorValue),
        Math.abs(outdoorValue),
        1
    );

    const barWidth = Math.min(90, width / 4);
    const positions = [width * 0.32, width * 0.68];

    values.forEach((value, index) => {

        const barHeight =
            Math.abs(value) / maxValue * 115;

        const x = positions[index] - barWidth / 2;
        const y = 155 - barHeight;

        const gradient = ctx.createLinearGradient(
            x, y, x + barWidth, 155
        );

        gradient.addColorStop(0, "#55e5ff");
        gradient.addColorStop(1, "#8a9cff");

        ctx.fillStyle = gradient;

        ctx.beginPath();

        ctx.roundRect(
            x,
            y,
            barWidth,
            Math.max(barHeight, 3),
            8
        );

        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Poppins, sans-serif";
        ctx.textAlign = "center";

        ctx.fillText(
            value.toFixed(1) + "°C",
            positions[index],
            Math.max(y - 10, 15)
        );

        ctx.fillStyle = "#bdc9e7";
        ctx.font = "12px Poppins, sans-serif";

        ctx.fillText(
            index === 0 ? "Indoor" : "Outdoor",
            positions[index],
            185
        );
    });
}


// Initial graph message
drawComparisonGraph();
