let device = null;
let characteristic = null;

const SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab";
const CHARACTERISTIC_UUID = "abcdefab-1234-1234-1234-abcdefabcdef";

let slouchCount = 0;
let totalSlouchTime = 0;
let score = 100;

// BUTTON EVENTS
document.getElementById("connectBtn").addEventListener("click", connectBLE);
document.getElementById("resetBtn").addEventListener("click", resetData);
document.getElementById("slider").addEventListener("input", handleSlider);

// CONNECT BLE
async function connectBLE() {
  try {
    device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [SERVICE_UUID]
    });

    device.addEventListener("gattserverdisconnected", onDisconnected);

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

    await characteristic.startNotifications();
    characteristic.addEventListener("characteristicvaluechanged", handleData);

    document.getElementById("status").innerText = "Connected";

  } catch (error) {
    console.error(error);
    alert("Bluetooth connection failed");
  }
}

// HANDLE DISCONNECT
function onDisconnected() {
  document.getElementById("status").innerText = "Disconnected";
  characteristic = null;
}

// HANDLE DATA
function handleData(event) {
  const value = new TextDecoder().decode(event.target.value);
  const parts = value.split(",");

  if (parts.length >= 5) {
    const angle = parseFloat(parts[0]);
    slouchCount = parseInt(parts[1]);
    totalSlouchTime = parseInt(parts[2]);
    score = parseInt(parts[4]);

    document.getElementById("angle").innerText = angle.toFixed(1) + "°";
    document.getElementById("slouchCount").innerText = slouchCount;
    document.getElementById("slouchTime").innerText = formatTime(totalSlouchTime);
    document.getElementById("score").innerText = score;

    updatePostureText(score);
  }
}

// RESET
function resetData() {
  slouchCount = 0;
  totalSlouchTime = 0;
  score = 100;

  document.getElementById("slouchCount").innerText = "0";
  document.getElementById("slouchTime").innerText = "00:00";
  document.getElementById("score").innerText = "100";
  document.getElementById("postureText").innerText = "Excellent Posture";

  if (characteristic) {
    characteristic.writeValueWithoutResponse(
      new TextEncoder().encode("RESET")
    );
  }
}

// SLIDER
function handleSlider(event) {
  const value = event.target.value;
  document.getElementById("sliderValue").innerText = value;

  if (characteristic) {
    characteristic.writeValueWithoutResponse(
      new TextEncoder().encode("TH:" + value)
    );
  }
}

// POSTURE TEXT
function updatePostureText(score) {
  const text = document.getElementById("postureText");

  if (score > 85) {
    text.innerText = "Excellent Posture";
    text.style.color = "#00ffcc";
  } else if (score > 60) {
    text.innerText = "Good Posture";
    text.style.color = "yellow";
  } else {
    text.innerText = "Improve Your Posture";
    text.style.color = "red";
  }
}

// FORMAT TIME
function formatTime(seconds) {
  let mins = Math.floor(seconds / 60);
  let secs = seconds % 60;

  return (
    String(mins).padStart(2, "0") +
    ":" +
    String(secs).padStart(2, "0")
  );
}
