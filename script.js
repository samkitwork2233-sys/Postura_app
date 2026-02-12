document.addEventListener("DOMContentLoaded", function () {

let characteristic = null;
const decoder = new TextDecoder();
const encoder = new TextEncoder();

// CONNECT
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

// HANDLE DATA
function handleData(event) {
  const value = decoder.decode(event.target.value);
  const parts = value.split(",");

  document.getElementById("angle").innerText = parseFloat(parts[0]).toFixed(2) + "°";
  document.getElementById("slouchCount").innerText = parts[1];
  document.getElementById("slouchTime").innerText = formatTime(parseInt(parts[2]));
  document.getElementById("score").innerText = parts[4];

  updateUI(parts[3]);
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

// RESET
document.getElementById("resetBtn").addEventListener("click", async function () {
  if (!characteristic) {
    alert("Device not connected.");
    return;
  }
  await characteristic.writeValue(encoder.encode("RESET"));
});

// SLIDER (REAL CONTROL)
document.getElementById("slider").addEventListener("input", async function () {
  const value = this.value;
  document.getElementById("sliderValue").innerText = value;

  if (characteristic) {
    await characteristic.writeValue(
      encoder.encode("TH:" + value)
    );
  }
});

// SERVICE WORKER
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js');
}

});
