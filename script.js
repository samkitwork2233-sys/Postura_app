const SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab";
const CHARACTERISTIC_UUID = "abcdefab-1234-1234-1234-abcdefabcdef";

let characteristic;
let chart;
let timeIndex = 0;

const angleDisplay = document.getElementById("angle");
const slouchDisplay = document.getElementById("slouchCount");
const timeDisplay = document.getElementById("slouchTime");
const statusText = document.getElementById("status");

document.getElementById("connectBtn").addEventListener("click", connectDevice);
document.getElementById("resetBtn").addEventListener("click", resetSession);

function initChart() {
  const ctx = document.getElementById("angleChart").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Angle (°)",
        data: [],
        borderColor: "#ffffff",
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { display: false },
        y: {
          min: -90,
          max: 90
        }
      }
    }
  });
}

window.addEventListener("load", initChart);

async function connectDevice() {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [SERVICE_UUID] }]
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

    await characteristic.startNotifications();
    characteristic.addEventListener("characteristicvaluechanged", handleData);

    statusText.innerText = "Connected";
  } catch (error) {
    alert("Connection Failed");
  }
}

function handleData(event) {
  const value = new TextDecoder().decode(event.target.value);
  const parts = value.split(",");

  const angle = parseFloat(parts[0]);
  const slouchCount = parseInt(parts[1]);
  const slouchTime = parseInt(parts[2]);

  angleDisplay.innerText = angle + "°";
  slouchDisplay.innerText = slouchCount;
  timeDisplay.innerText = slouchTime + " sec";

  updateChart(angle);
  saveSession(angle, slouchCount, slouchTime);
}

function updateChart(angle) {

  if (!chart) return;

  if (chart.data.labels.length > 50) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }

  chart.data.labels.push(timeIndex++);
  chart.data.datasets[0].data.push(angle);
  chart.update();
}

function saveSession(angle, count, time) {
  const session = {
    angle,
    count,
    time,
    timestamp: new Date().toISOString()
  };

  let history = JSON.parse(localStorage.getItem("posturaData")) || [];
  history.push(session);
  localStorage.setItem("posturaData", JSON.stringify(history));
}

function resetSession() {
  localStorage.removeItem("posturaData");

  chart.data.labels = [];
  chart.data.datasets[0].data = [];
  chart.update();

  angleDisplay.innerText = "0°";
  slouchDisplay.innerText = "0";
  timeDisplay.innerText = "0 sec";
}

