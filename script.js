let characteristic;
const decoder = new TextDecoder();
const encoder = new TextEncoder();

document.getElementById("connectBtn").addEventListener("click", async function () {

  if (!navigator.bluetooth) {
    alert("Web Bluetooth not supported.");
    return;
  }

  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ name: "POSTURA_V3" }],
      optionalServices: ["12345678-1234-1234-1234-1234567890ab"]
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService("12345678-1234-1234-1234-1234567890ab");
    characteristic = await service.getCharacteristic("abcdefab-1234-1234-1234-abcdefabcdef");

    await characteristic.startNotifications();

    document.getElementById("status").innerText = "Connected";

    characteristic.addEventListener("characteristicvaluechanged", handleData);

  } catch (error) {
    console.error(error);
  }
});

function handleData(event) {
  const value = decoder.decode(event.target.value);
  const parts = value.split(",");

  const angle = parseFloat(parts[0]);
  const slouchCount = parseInt(parts[1]);
  const slouchTime = parseInt(parts[2]);
  const status = parts[3];
  const score = parseInt(parts[4]);

  document.getElementById("angle").innerText = angle.toFixed(2) + "°";
  document.getElementById("slouchCount").innerText = slouchCount;
  document.getElementById("slouchTime").innerText = formatTime(slouchTime);
  document.getElementById("score").innerText = score;

  updateUI(status);
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return String(min).padStart(2, '0') + ":" + String(sec).padStart(2, '0');
}

function updateUI(status) {
  const circle = document.querySelector(".circle");

  if (status === "GOOD") {
    circle.style.borderColor = "green";
    document.getElementById("postureText").innerText = "Excellent Posture";
  } else {
    circle.style.borderColor = "red";
    document.getElementById("postureText").innerText = "Bad Posture";
  }
}

// ===== RESET BUTTON =====
document.getElementById("resetBtn").addEventListener("click", async function () {
  if (!characteristic) return;

  await characteristic.writeValue(encoder.encode("RESET"));
});

// Sensitivity Slider (UI only)
document.getElementById("slider").addEventListener("input", function () {
  document.getElementById("sliderValue").innerText = this.value;
});
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log("Service Worker Registered"));
}

