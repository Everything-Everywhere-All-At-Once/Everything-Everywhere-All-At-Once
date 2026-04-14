import type { DeviceSpec } from "./devices";

export type IssueLevel = "error" | "warn" | "ok";

export type Issue = {
  level: IssueLevel;
  field: string;
  message: string;
  fixable: boolean;
  fixHint?: string;
};

export type FileReport = {
  file: File;
  name: string;
  ext: string;
  sizeMB: number;
  estimatedBitrateKbps: number;
  sampleRate: number;
  duration: number;
  channels: number;
  issues: Issue[];
  status: "pass" | "warn" | "fail";
};

function estimateBitrate(file: File, duration: number): number {
  return Math.round((file.size * 8) / duration / 1000);
}

function getAudioMeta(file: File): Promise<{ duration: number; sampleRate: number; channels: number }> {
  return new Promise((resolve) => {
    const AudioCtx = window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    file.arrayBuffer().then((buf) => {
      ctx.decodeAudioData(
        buf,
        (decoded) => {
          ctx.close();
          resolve({ duration: decoded.duration, sampleRate: decoded.sampleRate, channels: decoded.numberOfChannels });
        },
        () => {
          ctx.close();
          // Fallback: use HTML Audio element
          const audio = new Audio();
          const url = URL.createObjectURL(file);
          audio.src = url;
          audio.onloadedmetadata = () => {
            URL.revokeObjectURL(url);
            resolve({ duration: audio.duration, sampleRate: 44100, channels: 2 });
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            resolve({ duration: 0, sampleRate: 44100, channels: 2 });
          };
        }
      );
    });
  });
}

export async function analyzeFile(file: File, device: DeviceSpec): Promise<FileReport> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const sizeMB = file.size / 1024 / 1024;
  const issues: Issue[] = [];

  // Get audio metadata
  const { duration, sampleRate, channels } = await getAudioMeta(file);
  const estimatedBitrateKbps = duration > 0 ? estimateBitrate(file, duration) : 0;

  // 1. Format check
  if (!device.formats.includes(ext)) {
    issues.push({
      level: "error",
      field: "Format",
      message: `${ext.toUpperCase()} is not supported by the ${device.shortName}`,
      fixable: true,
      fixHint: `Convert to ${device.formats.includes("mp3") ? "MP3" : "WAV"}`,
    });
  }

  // 2. Bitrate check (for lossy formats)
  const lossless = ["wav", "flac", "aiff", "aif"].includes(ext);
  if (!lossless && estimatedBitrateKbps > device.maxBitrateKbps) {
    issues.push({
      level: "error",
      field: "Bitrate",
      message: `Estimated bitrate ${estimatedBitrateKbps} kbps exceeds device max of ${device.maxBitrateKbps} kbps`,
      fixable: true,
      fixHint: `Re-encode at ${device.maxBitrateKbps} kbps`,
    });
  }

  // 3. Sample rate check
  if (sampleRate > 0 && !device.sampleRates.includes(sampleRate)) {
    issues.push({
      level: "error",
      field: "Sample Rate",
      message: `${sampleRate / 1000} kHz is not supported. Supported: ${device.sampleRates.map((s) => s / 1000 + "kHz").join(", ")}`,
      fixable: true,
      fixHint: `Resample to 44.1 kHz`,
    });
  }

  // 4. File size check
  if (sizeMB > device.maxFileSizeMB) {
    issues.push({
      level: "error",
      field: "File Size",
      message: `File size ${sizeMB.toFixed(1)} MB exceeds device limit of ${device.maxFileSizeMB} MB`,
      fixable: false,
    });
  }

  // 5. FLAC on non-FLAC devices
  if (ext === "flac" && !device.flac) {
    issues.push({
      level: "error",
      field: "FLAC",
      message: `${device.shortName} does not support FLAC files`,
      fixable: true,
      fixHint: "Convert to WAV (lossless) or MP3 320kbps",
    });
  }

  // 6. High sample rate warning on older devices
  if (sampleRate > 48000 && device.sampleRates.includes(sampleRate)) {
    issues.push({
      level: "warn",
      field: "Sample Rate",
      message: `${sampleRate / 1000} kHz is supported but may impact performance on older firmware`,
      fixable: true,
      fixHint: "Consider converting to 44.1 kHz for best compatibility",
    });
  }

  // 7. Low bitrate warning
  if (!lossless && estimatedBitrateKbps > 0 && estimatedBitrateKbps < 128) {
    issues.push({
      level: "warn",
      field: "Bitrate",
      message: `Low bitrate (${estimatedBitrateKbps} kbps) — audio quality may be poor on club systems`,
      fixable: false,
    });
  }

  // 8. OGG on Pioneer devices
  if (ext === "ogg" && device.brand === "Pioneer") {
    issues.push({
      level: "error",
      field: "Format",
      message: `OGG is not supported on Pioneer devices`,
      fixable: true,
      fixHint: "Convert to MP3 320kbps",
    });
  }

  // 9. Special characters in filename
  if (/[^\w\s.\-_()]/.test(file.name)) {
    issues.push({
      level: "warn",
      field: "Filename",
      message: "Filename contains special characters that may cause playback issues",
      fixable: false,
      fixHint: "Rename file to use only letters, numbers, spaces, and dashes",
    });
  }

  // 10. Very long filename
  if (file.name.length > 64) {
    issues.push({
      level: "warn",
      field: "Filename",
      message: `Filename is ${file.name.length} characters — some devices truncate at 64`,
      fixable: false,
    });
  }

  const errors = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warn");

  let status: FileReport["status"] = "pass";
  if (errors.length > 0) status = "fail";
  else if (warns.length > 0) status = "warn";

  return {
    file,
    name: file.name,
    ext,
    sizeMB,
    estimatedBitrateKbps,
    sampleRate,
    duration,
    channels,
    issues,
    status,
  };
}

export async function analyzeFiles(files: File[], device: DeviceSpec): Promise<FileReport[]> {
  return Promise.all(files.map((f) => analyzeFile(f, device)));
}
