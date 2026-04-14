/**
 * Audio analysis utilities
 * BPM: onset detection + autocorrelation
 * Key: Krumhansl-Schmuckler algorithm using chroma features
 */

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Krumhansl-Schmuckler key profiles
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function correlate(chroma: number[], profile: number[]): number {
  const n = 12;
  const meanC = chroma.reduce((a, b) => a + b, 0) / n;
  const meanP = profile.reduce((a, b) => a + b, 0) / n;
  let num = 0, denC = 0, denP = 0;
  for (let i = 0; i < n; i++) {
    const dc = chroma[i] - meanC;
    const dp = profile[i] - meanP;
    num += dc * dp;
    denC += dc * dc;
    denP += dp * dp;
  }
  return num / Math.sqrt(denC * denP + 1e-10);
}

export function detectKey(channelData: Float32Array, sampleRate: number): { key: string; mode: "major" | "minor"; confidence: number } {
  // Build chroma vector from FFT bins
  const fftSize = 8192;
  const hop = Math.floor(channelData.length / 64);
  const chroma = new Array(12).fill(0);

  for (let frame = 0; frame < 64; frame++) {
    const start = frame * hop;
    const slice = channelData.slice(start, start + fftSize);
    if (slice.length < fftSize) break;

    // Apply Hann window
    const windowed = new Float32Array(fftSize);
    for (let i = 0; i < fftSize; i++) {
      windowed[i] = slice[i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / fftSize));
    }

    // Simple DFT for relevant frequency bins (A2=110Hz to C8=4186Hz)
    const minBin = Math.floor((110 * fftSize) / sampleRate);
    const maxBin = Math.ceil((4200 * fftSize) / sampleRate);

    for (let bin = minBin; bin < maxBin; bin++) {
      let re = 0, im = 0;
      // Approximate using every 4th sample for speed
      for (let i = 0; i < fftSize; i += 4) {
        const angle = (2 * Math.PI * bin * i) / fftSize;
        re += windowed[i] * Math.cos(angle);
        im -= windowed[i] * Math.sin(angle);
      }
      const mag = Math.sqrt(re * re + im * im);
      if (mag < 0.001) continue;

      const freq = (bin * sampleRate) / fftSize;
      // Map frequency to chroma bin
      const midiNote = 12 * Math.log2(freq / 440) + 69;
      const chromaBin = ((Math.round(midiNote) % 12) + 12) % 12;
      chroma[chromaBin] += mag;
    }
  }

  // Normalize chroma
  const maxC = Math.max(...chroma);
  const normChroma = chroma.map((v) => v / (maxC + 1e-10));

  // Test all 12 keys in major and minor
  let bestScore = -Infinity;
  let bestKey = 0;
  let bestMode: "major" | "minor" = "major";

  for (let root = 0; root < 12; root++) {
    const rotated = [...normChroma.slice(root), ...normChroma.slice(0, root)];
    const majScore = correlate(rotated, MAJOR_PROFILE);
    const minScore = correlate(rotated, MINOR_PROFILE);

    if (majScore > bestScore) { bestScore = majScore; bestKey = root; bestMode = "major"; }
    if (minScore > bestScore) { bestScore = minScore; bestKey = root; bestMode = "minor"; }
  }

  return {
    key: NOTE_NAMES[bestKey],
    mode: bestMode,
    confidence: Math.round(((bestScore + 1) / 2) * 100),
  };
}

export function detectBPM(channelData: Float32Array, sampleRate: number): number {
  // Downsample to ~11025 Hz for speed
  const step = Math.floor(sampleRate / 11025);
  const downsampled: number[] = [];
  for (let i = 0; i < channelData.length; i += step) {
    downsampled.push(Math.abs(channelData[i]));
  }
  const sr = sampleRate / step;

  // Onset strength envelope via half-wave rectified difference
  const windowSize = Math.floor(sr * 0.02);
  const envelope: number[] = [];
  for (let i = windowSize; i < downsampled.length; i++) {
    let prev = 0, curr = 0;
    for (let j = 0; j < windowSize; j++) {
      prev += downsampled[i - j - 1];
      curr += downsampled[i - j];
    }
    envelope.push(Math.max(0, curr - prev));
  }

  // Autocorrelation over BPM range 60-200
  const minLag = Math.floor((60 / 200) * sr);
  const maxLag = Math.floor((60 / 60) * sr);

  let bestBPM = 120;
  let bestCorr = -Infinity;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    const limit = Math.min(envelope.length - lag, 8 * sr);
    for (let i = 0; i < limit; i++) {
      corr += envelope[i] * envelope[i + lag];
    }
    corr /= limit;
    if (corr > bestCorr) {
      bestCorr = corr;
      bestBPM = Math.round((60 / lag) * sr);
    }
  }

  // Snap to musically common BPM (multiples/halves)
  const candidates = [bestBPM, bestBPM * 2, bestBPM / 2].filter((b) => b >= 60 && b <= 200);
  return Math.round(candidates[0]);
}

export function analyzeAudio(file: File): Promise<{
  bpm: number;
  key: string;
  mode: "major" | "minor";
  confidence: number;
  duration: number;
  sampleRate: number;
  channels: number;
}> {
  return new Promise((resolve, reject) => {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    file.arrayBuffer().then((buf) => {
      ctx.decodeAudioData(buf, (decoded) => {
        // Use mono mix for analysis
        const mono = new Float32Array(decoded.length);
        for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
          const data = decoded.getChannelData(ch);
          for (let i = 0; i < decoded.length; i++) {
            mono[i] += data[i] / decoded.numberOfChannels;
          }
        }

        // Analyze on a 60-second window max for speed
        const maxSamples = decoded.sampleRate * 60;
        const sample = mono.length > maxSamples ? mono.slice(0, maxSamples) : mono;

        const bpm = detectBPM(sample, decoded.sampleRate);
        const { key, mode, confidence } = detectKey(sample, decoded.sampleRate);

        ctx.close();
        resolve({
          bpm,
          key,
          mode,
          confidence,
          duration: decoded.duration,
          sampleRate: decoded.sampleRate,
          channels: decoded.numberOfChannels,
        });
      }, reject);
    }).catch(reject);
  });
}
