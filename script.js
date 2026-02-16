let device;
let characteristic;

let slouchCount = 0;
let totalSlouchTime = 0;
let postureScore = 100;

let sessionStartTime = 0;
let sessionDuration = 0;
let sessionInterval;

let chart;

// ================= CONNECT =================
async function connectBLE() {
    try {
        device = await navigator.bluetooth.requestDevice({
            filters: [
                { services: ['12345678-1234-1234-1234-1234567890ab'] }
            ]
        });

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('12345678-1234-1234-1234-1234567890ab');
        characteristic = await service.getCharacteristic('abcdefab-1234-1234-1234-abcdefabcdef');

        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', handleData);

        document.getElementById("status").innerText = "Connected";
        document.getElementById("deviceName").innerText = device.name || "POSTURA";

        startSession();

    } catch (error) {
        alert("Connection Failed");
    }
}

// ================= DISCONNECT =================
function disconnectBLE() {
    if (device && device.gatt.connected) {
        device.gatt.disconnect();
        document.getElementById("status").innerText = "Disconnected";
        document.getElementById("deviceName").innerText = "-";
        endSession();
    }
}

// ================= HANDLE DATA =================
function handleData(event) {
    const value = new TextDecoder().decode(event.target.value);
    const parts = value.split(",");

    if (parts.length >= 5) {
        const angle = parseFloat(parts[0]);
        slouchCount = parseInt(parts[1]);
        totalSlouchTime = parseInt(parts[2]);
        const status = parts[3];
        postureScore = parseInt(parts[4]);

        document.getElementById("angle").innerText = angle;
        document.getElementById("slouchCount").innerText = slouchCount;
        document.getElementById("slouchTime").innerText = totalSlouchTime;
        document.getElementById("postureScore").innerText = postureScore;

        document.getElementById("angle").style.color =
            status === "GOOD" ? "green" : "red";
    }
}

// ================= SESSION =================
function startSession() {
    sessionStartTime = Date.now();
    sessionInterval = setInterval(() => {
        sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
        document.getElementById("sessionDuration").innerText = sessionDuration;
    }, 1000);
}

function endSession() {
    clearInterval(sessionInterval);
    if (sessionDuration < 5) return;
    saveSessionData();
    loadHistory();
    updateChart();
}

// ================= DATA LOGGING =================
function saveSessionData() {
    const today = new Date().toLocaleDateString();

    const sessionData = {
        date: today,
        slouchCount,
        slouchTime: totalSlouchTime,
        postureScore,
        duration: sessionDuration
    };

    let history = JSON.parse(localStorage.getItem("posturaHistory")) || [];
    history.push(sessionData);
    localStorage.setItem("posturaHistory", JSON.stringify(history));
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem("posturaHistory")) || [];
    const container = document.getElementById("historyContainer");
    container.innerHTML = "";

    history.forEach(record => {
        container.innerHTML += `
            <div class="history-item">
                <b>Date:</b> ${record.date}<br>
                Slouches: ${record.slouchCount}<br>
                Slouch Time: ${record.slouchTime} sec<br>
                Duration: ${record.duration} sec<br>
                Score: ${record.postureScore}% 
            </div>
        `;
    });
}

// ================= CHART =================
function updateChart() {
    const history = JSON.parse(localStorage.getItem("posturaHistory")) || [];
    const labels = history.map(item => item.date);
    const scores = history.map(item => item.postureScore);

    if (chart) chart.destroy();

    const ctx = document.getElementById('postureChart').getContext('2d');

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Posture Score (%)',
                data: scores,
                borderWidth: 3,
                tension: 0.3
            }]
        },
        options: {
            scales: {
                y: { min: 0, max: 100 }
            }
        }
    });
}

// ================= SENSITIVITY =================
function updateSensitivity(value) {
    document.getElementById("sensitivityValue").innerText = value;

    if (characteristic) {
        const command = "TH:" + value;
        characteristic.writeValue(new TextEncoder().encode(command));
    }
}

function clearHistory() {
    localStorage.removeItem("posturaHistory");
    loadHistory();
    updateChart();
}

window.onload = function () {
    loadHistory();
    updateChart();
};
