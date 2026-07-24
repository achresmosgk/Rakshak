// Foreground alert feedback: a synthesized siren (no external audio file
// needed) plus device vibration. Browsers block audio/vibration until a user
// gesture has happened on the page, so primeAlertAudio() must be called from
// a click handler before triggerAlert() will actually produce sound.

let audioCtx = null;

export function primeAlertAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;

  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

export function isAudioPrimed() {
  return audioCtx != null && audioCtx.state === "running";
}

// A two-tone sweep synthesized with an oscillator, mimicking a siren.
export function playSiren(durationSec = 2.5) {
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  oscillator.type = "sawtooth";
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.05);

  const sweepSec = 0.5;
  const cycles = Math.ceil(durationSec / sweepSec);
  for (let i = 0; i < cycles; i++) {
    const t = now + i * sweepSec;
    oscillator.frequency.setValueAtTime(600, t);
    oscillator.frequency.linearRampToValueAtTime(1200, t + sweepSec / 2);
    oscillator.frequency.linearRampToValueAtTime(600, t + sweepSec);
  }

  gain.gain.setValueAtTime(0.25, now + durationSec - 0.1);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start(now);
  oscillator.stop(now + durationSec);
}

// No-op on iOS Safari, which has never implemented the Vibration API.
export function vibrateAlert() {
  navigator.vibrate?.([300, 150, 300, 150, 300]);
}

export function triggerAlert() {
  playSiren();
  vibrateAlert();
}
