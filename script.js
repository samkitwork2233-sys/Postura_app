// ================= UUIDs =================
const SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab";
const CHARACTERISTIC_UUID = "abcdefab-1234-1234-1234-abcdefabcdef";

// ================= Variables =================
let device, characteristic;
let postureChart;
let graphIndex = 0;
let sessionStart = Date.now();
let currentScore = 100;

// ================= UI Elements =================
const angleEl = document.getElementById("angle");
const slouchCountEl = document.getElementById("slouchCount");
const slouchTimeEl = document.getElementById("slouchTime");
const scoreEl = document.getElementById("score");
const postureLabel = document.getElementById("postureLabel");
const statusEl = document.getElementById("status");
const historyEl = document.getElementById("history");

// ================= BLE CONNECT =================
document.getElementById("connectBtn").addEventListener("click", async () => {
  try {
    device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [SERVICE_UUID] }]
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

    await characteristic.startNotifications();
    characteristic.addEventListener("characteristicvaluechanged", handleData);

    statusEl.innerText = "Connected";
  } catch (error) {
    alert("Bluetooth connection failed.");
  }
});

// ================= HANDLE BLE DATA =================
function handleData(event) {

  const raw = new TextDecoder().decode(event.target.value);
  const parts = raw.split(",");

  if (parts.length < 5) return;

  const angle = parseFloat(parts[0]);
  const slouchCount = parseInt(parts[1]);
  const slouchTime = parseInt(parts[2]);
  const postureStatus = parts[3];
  const score = parseInt(parts[4]);

  if (isNaN(angle)) return;

  angleEl.innerText = angle.toFixed(2) + "°";
  slouchCountEl.innerText = slouchCount;
  slouchTimeEl.innerText = formatTime(slouchTime);
  scoreEl.innerText = score;

  currentScore = score;

  // Update label
  if (postureStatus === "GOOD") {
    postureLabel.innerText = "Excellent Posture";
  } else {
    postureLabel.innerText = "Bad Posture";
  }

  updateGraph(angle);
}

// ================= GRAPH =================
function initGraph() {
  const ctx = document.getElementById("angleChart").getContext("2d");

  postureChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Posture Angle (°)",
        data: [],
        borderColor: "#00ffc3",
        borderWidth: 3,
        tension: 0.3,
        fill: false
      }]
    },
    options: {
      responsive: true,
      animation: false,
      scales: {
        x: { display: false },
        y: {
          min: -60,
          max: 60,
          ticks: { color: "white" }
        }
      },
      plugins: {
        legend: {
          labels: { color: "white" }
        }
      }
    }
  });
}

function updateGraph(angle) {
  if (!postureChart) return;

  if (postureChart.data.labels.length > 60) {
    postureChart.data.labels.shift();
    postureChart.data.datasets[0].data.shift();
  }

  postureChart.data.labels.push(graphIndex++);
  postureChart.data.datasets[0].data.push(angle);
  postureChart.update();
}

window.addEventListener("load", initGraph);

// ================= RESET =================
document.getElementById("resetBtn").addEventListener("click", () => {
  if (characteristic) {
    const encoder = new TextEncoder();
    characteristic.writeValue(encoder.encode("RESET"));
  }
});

// ================= SENSITIVITY =================
const slider = document.getElementById("sensitivitySlider");
slider.addEventListener("input", function () {
  const value = this.value;
  document.getElementById("sensitivityValue").innerText = value;

  if (characteristic) {
    const encoder = new TextEncoder();
    characteristic.writeValue(encoder.encode("TH:" + value));
  }
});

// ================= END SESSION =================
document.getElementById("endBtn").addEventListener("click", () => {

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

// ================= HISTORY =================
document.getElementById("clearHistory").addEventListener("click", () => {
  localStorage.removeItem("posturaHistory");
  loadHistory();
});

function loadHistory() {
  historyEl.innerHTML = "";
  let history = JSON.parse(localStorage.getItem("posturaHistory")) || [];

  history.forEach(item => {
    historyEl.innerHTML += `
      <div class="history-card">
        <strong>${item.date}</strong><br>
        Score: ${item.score}%<br>
        Duration: ${item.duration}
      </div>
    `;
  });
}

loadHistory();

// ================= UTIL =================
function formatTime(seconds) {
  let m = Math.floor(seconds / 60);
  let s = seconds % 60;
  return String(m).padStart(2, '0') + ":" + String(s).padStart(2, '0');
}
