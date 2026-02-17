const SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab";
const CHARACTERISTIC_UUID = "abcdefab-1234-1234-1234-abcdefabcdef";

let characteristic;
let chart;
let graphIndex = 0;
let sessionStart = Date.now();
let currentScore = 100;

const angleEl = document.getElementById("angle");
const slouchCountEl = document.getElementById("slouchCount");
const slouchTimeEl = document.getElementById("slouchTime");
const scoreEl = document.getElementById("score");
const postureStatusEl = document.getElementById("postureStatus");
const statusEl = document.getElementById("status");
const historyEl = document.getElementById("history");

// GRAPH INIT
function initChart() {
  const ctx = document.getElementById("chart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        data: [],
        borderColor: "#00ffc3",
        borderWidth: 3,
        tension: 0.3
      }]
    },
    options: {
      animation: false,
      scales: {
        x: { display: false },
        y: { min: -60, max: 60 }
      }
    }
  });
}
initChart();

// CONNECT
document.getElementById("connectBtn").addEventListener("click", async () => {

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [SERVICE_UUID] }]
  });

  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(SERVICE_UUID);
  characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

  await characteristic.startNotifications();
  characteristic.addEventListener("characteristicvaluechanged", handleData);

  statusEl.textContent = "Connected";
  statusEl.classList.remove("disconnected");
  statusEl.classList.add("connected");
});

// HANDLE DATA
function handleData(event) {

  const raw = new TextDecoder().decode(event.target.value);
  const parts = raw.split(",");

  if (parts.length < 5) return;

  const angle = parseFloat(parts[0]);
  const slouchCount = parseInt(parts[1]);
  const slouchTime = parseInt(parts[2]);
  const postureStatus = parts[3];
  const score = parseInt(parts[4]);

  angleEl.textContent = angle.toFixed(2) + "°";
  slouchCountEl.textContent = slouchCount;
  slouchTimeEl.textContent = formatTime(slouchTime);
  scoreEl.textContent = score;
  postureStatusEl.textContent = postureStatus;

  currentScore = score;

  updateGraph(angle);
}

// GRAPH UPDATE
function updateGraph(angle) {
  if (chart.data.labels.length > 60) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  chart.data.labels.push(graphIndex++);
  chart.data.datasets[0].data.push(angle);
  chart.update();
}

// RESET
document.getElementById("resetBtn").addEventListener("click", () => {
  if (characteristic) {
    const encoder = new TextEncoder();
    characteristic.writeValue(encoder.encode("RESET"));
  }
});

// SENSITIVITY
const slider = document.getElementById("slider");
slider.addEventListener("input", function () {
  document.getElementById("sensitivityValue").textContent = this.value;

  if (characteristic) {
    const encoder = new TextEncoder();
    characteristic.writeValue(encoder.encode("TH:" + this.value));
  }
});

// HISTORY
document.getElementById("endSession").addEventListener("click", () => {
  const duration = Math.floor((Date.now() - sessionStart) / 1000);

  const session = {
    date: new Date().toLocaleString(),
    score: currentScore,
    duration: formatTime(duration)
  };

  let history = JSON.parse(localStorage.getItem("posturaHistory")) || [];
  history.unshift(session);
  localStorage.setItem("posturaHistory", JSON.stringify(history));
  loadHistory();
});

document.getElementById("clearHistory").addEventListener("click", () => {
  localStorage.removeItem("posturaHistory");
  loadHistory();
});

function loadHistory() {
  historyEl.innerHTML = "";
  let history = JSON.parse(localStorage.getItem("posturaHistory")) || [];

  history.forEach(item => {
    historyEl.innerHTML += `
      <div class="card">
        <strong>${item.date}</strong><br>
        Score: ${item.score}%<br>
        Duration: ${item.duration}
      </div>
    `;
  });
}

loadHistory();

function formatTime(seconds) {
  let m = Math.floor(seconds / 60);
  let s = seconds % 60;
  return String(m).padStart(2, '0') + ":" + String(s).padStart(2, '0');
}
