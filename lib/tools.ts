export type Tool = {
  name: string;
  description: string;
  href: string;
  status: "live" | "soon";
};

export type Category = {
  id: string;
  label: string;
  description: string;
  accent: string;
  glowColor: string;
  icon: string;
  tools: Tool[];
};

export const categories: Category[] = [
  {
    id: "audio",
    label: "Audio & Music",
    description: "Convert formats, analyze bitrate, edit metadata, trim clips and normalize loudness.",
    accent: "#00FFFF",
    glowColor: "rgba(0,255,255,0.15)",
    icon: "~",
    tools: [
      { name: "Format Converter", description: "MP3 / WAV / FLAC / OGG / AAC", href: "/tools/audio/convert", status: "live" },
      { name: "Bitrate Analyzer", description: "Check audio quality & bitrate", href: "/tools/audio/bitrate", status: "live" },
      { name: "Key & BPM Detector", description: "Find the musical key and tempo", href: "/tools/audio/key-bpm", status: "live" },
      { name: "Audio Trimmer", description: "Cut and split audio files", href: "/tools/audio/trim", status: "live" },
      { name: "Metadata Editor", description: "Edit ID3 tags & cover art", href: "/tools/audio/metadata", status: "live" },
      { name: "Vocal Remover", description: "Stem split — isolate vocals", href: "/tools/audio/vocals", status: "soon" },
      { name: "Audio Normalizer", description: "Level out volume across tracks", href: "/tools/audio/normalize", status: "live" },
      { name: "BPM Tap Counter", description: "Tap to measure beats per minute", href: "/tools/audio/bpm-tap", status: "live" },
      { name: "Waveform Visualizer", description: "Visualize audio waveform from file", href: "/tools/audio/waveform", status: "live" },
      { name: "Metronome", description: "Precise click track with BPM control", href: "/tools/audio/metronome", status: "live" },
    ],
  },
  {
    id: "dj",
    label: "DJ Tools",
    description: "USB compatibility checks, auto-fix & convert, BPM/key tagging and Rekordbox prep.",
    accent: "#EF4444",
    glowColor: "rgba(239,68,68,0.15)",
    icon: "⏺",
    tools: [
      { name: "USB Compatibility Checker", description: "Analyze files for your CDJ/mixer", href: "/tools/dj/usb-check", status: "live" },
      { name: "Auto-Fix & Convert", description: "Fix files to match device specs", href: "/tools/dj/fix", status: "live" },
      { name: "Rekordbox Prep", description: "Format USB for Pioneer devices", href: "/tools/dj/rekordbox", status: "soon" },
      { name: "BPM & Key Tagger", description: "Batch tag your entire library", href: "/tools/dj/tag", status: "live" },
    ],
  },
  {
    id: "image",
    label: "Image & Art",
    description: "Convert, compress, upscale, remove backgrounds, extract palettes and strip EXIF.",
    accent: "#A855F7",
    glowColor: "rgba(168,85,247,0.15)",
    icon: "◈",
    tools: [
      { name: "Format Converter", description: "PNG / JPG / WebP / AVIF / SVG", href: "/tools/image/convert", status: "live" },
      { name: "Background Remover", description: "AI-powered, runs in browser", href: "/tools/image/bg-remove", status: "live" },
      { name: "Image Compressor", description: "Shrink file size, keep quality", href: "/tools/image/compress", status: "live" },
      { name: "AI Upscaler", description: "Enhance resolution with AI", href: "/tools/image/upscale", status: "live" },
      { name: "Color Palette Extractor", description: "Pull colors from any image", href: "/tools/image/palette", status: "live" },
      { name: "EXIF Viewer / Remover", description: "View or strip metadata", href: "/tools/image/exif", status: "live" },
      { name: "Image to ASCII", description: "Convert images to ASCII art", href: "/tools/image/ascii", status: "live" },
    ],
  },
  {
    id: "video",
    label: "Video",
    description: "Convert formats, trim clips, compress, make GIFs and pull thumbnail frames.",
    accent: "#F97316",
    glowColor: "rgba(249,115,22,0.15)",
    icon: "▶",
    tools: [
      { name: "Format Converter", description: "MP4 / MOV / AVI / WebM / MKV", href: "/tools/video/convert", status: "live" },
      { name: "Video Trimmer", description: "Cut clips without re-encoding", href: "/tools/video/trim", status: "live" },
      { name: "GIF Maker", description: "Video → animated GIF", href: "/tools/video/gif", status: "live" },
      { name: "Video Compressor", description: "Reduce file size", href: "/tools/video/compress", status: "live" },
      { name: "Thumbnail Extractor", description: "Pull frames as images", href: "/tools/video/thumbnail", status: "live" },
    ],
  },
  {
    id: "docs",
    label: "Documents & PDF",
    description: "Merge, split, OCR, convert Word/Markdown/text to PDF and extract images.",
    accent: "#94A3B8",
    glowColor: "rgba(148,163,184,0.15)",
    icon: "⬡",
    tools: [
      { name: "Image → PDF", description: "Convert PNG/JPG to PDF", href: "/tools/docs/image-to-pdf", status: "live" },
      { name: "PDF → Image", description: "Extract pages as images", href: "/tools/docs/pdf-to-image", status: "live" },
      { name: "PDF Merger", description: "Combine multiple PDFs", href: "/tools/docs/merge", status: "live" },
      { name: "PDF Splitter", description: "Split PDF into pages", href: "/tools/docs/split", status: "live" },
      { name: "OCR", description: "Image to editable text", href: "/tools/docs/ocr", status: "live" },
      { name: "Markdown → PDF", description: "Render MD as PDF", href: "/tools/docs/md-to-pdf", status: "live" },
      { name: "DOCX → PDF", description: "Word documents to PDF", href: "/tools/docs/docx-to-pdf", status: "live" },
      { name: "DOCX → HTML", description: "Word to clean HTML", href: "/tools/docs/docx-to-html", status: "live" },
      { name: "TXT / CSV → PDF", description: "Plain text to PDF", href: "/tools/docs/txt-to-pdf", status: "live" },
    ],
  },
  {
    id: "cyber",
    label: "Cybersecurity",
    description: "Encrypt text, hash files, generate passwords, decode JWTs, QR codes and steganography.",
    accent: "#22C55E",
    glowColor: "rgba(34,197,94,0.15)",
    icon: "⬢",
    tools: [
      { name: "Text Encryptor", description: "AES-256 encrypt/decrypt text", href: "/tools/cyber/encrypt", status: "live" },
      { name: "Hash Generator", description: "MD5 / SHA-1 / SHA-256 / SHA-512", href: "/tools/cyber/hash", status: "live" },
      { name: "Password Generator", description: "Strong random passwords", href: "/tools/cyber/password", status: "live" },
      { name: "Base64 Encoder", description: "Encode and decode Base64", href: "/tools/cyber/base64", status: "live" },
      { name: "JWT Decoder", description: "Decode & inspect JWT tokens", href: "/tools/cyber/jwt", status: "live" },
      { name: "QR Generator", description: "Create & read QR codes", href: "/tools/cyber/qr", status: "live" },
      { name: "Steganography", description: "Hide data inside images", href: "/tools/cyber/stego", status: "live" },
      { name: "WHOIS Lookup", description: "Domain registration & DNS info", href: "/tools/cyber/whois", status: "live" },
      { name: "DNS Lookup", description: "Query A, MX, TXT, NS, CNAME records", href: "/tools/cyber/dns", status: "live" },
      { name: "robots.txt Analyzer", description: "Parse and audit robots.txt files", href: "/tools/cyber/robots", status: "live" },
      { name: "IP / CIDR Calculator", description: "Subnet, broadcast & host range", href: "/tools/cyber/ip-calc", status: "live" },
      { name: "JWT Builder", description: "Build and sign JWT tokens in browser", href: "/tools/cyber/jwt-builder", status: "live" },
    ],
  },
  {
    id: "ai",
    label: "AI Tools",
    description: "Summarize content, fix grammar, explain code, caption images and craft prompts.",
    accent: "#FACC15",
    glowColor: "rgba(250,204,21,0.15)",
    icon: "◎",
    tools: [
      { name: "Text Summarizer", description: "Condense long content with AI", href: "/tools/ai/summarize", status: "live" },
      { name: "Grammar Checker", description: "Fix & improve writing", href: "/tools/ai/grammar", status: "live" },
      { name: "Code Explainer", description: "Understand any code snippet", href: "/tools/ai/code", status: "live" },
      { name: "Image Captioner", description: "Auto-describe images with AI", href: "/tools/ai/caption", status: "live" },
      { name: "Prompt Builder", description: "Craft better AI prompts", href: "/tools/ai/prompt", status: "live" },
    ],
  },
  {
    id: "webdesign",
    label: "Web Design",
    description: "Color schemes, gradients, box shadows, typography pairs, favicons, meta tags and SVG optimization.",
    accent: "#EC4899",
    glowColor: "rgba(236,72,153,0.15)",
    icon: "◇",
    tools: [
      { name: "Color Scheme Generator", description: "Generate harmonious palettes", href: "/tools/web/colors", status: "live" },
      { name: "Gradient Generator", description: "CSS gradient builder", href: "/tools/web/gradient", status: "live" },
      { name: "Box Shadow Generator", description: "Visual shadow builder", href: "/tools/web/shadow", status: "live" },
      { name: "Typography Pairer", description: "Find matching font pairs", href: "/tools/web/typography", status: "live" },
      { name: "Favicon Generator", description: "Create favicons from any image", href: "/tools/web/favicon", status: "live" },
      { name: "Meta Tag Generator", description: "SEO & OG tag builder", href: "/tools/web/meta", status: "live" },
      { name: "SVG Optimizer", description: "Clean and compress SVGs", href: "/tools/web/svg", status: "live" },
    ],
  },
  {
    id: "qol",
    label: "Quality of Life",
    description: "Unit converter, time zones, JSON formatter, regex tester, diff checker, UUID and Pomodoro.",
    accent: "#6366F1",
    glowColor: "rgba(99,102,241,0.15)",
    icon: "○",
    tools: [
      { name: "Unit Converter", description: "Length, weight, temp & more", href: "/tools/qol/units", status: "live" },
      { name: "Time Zone Converter", description: "Convert times across zones", href: "/tools/qol/timezone", status: "live" },
      { name: "JSON Formatter", description: "Validate & prettify JSON", href: "/tools/qol/json", status: "live" },
      { name: "Regex Tester", description: "Test regex with live matching", href: "/tools/qol/regex", status: "live" },
      { name: "Diff Checker", description: "Compare two blocks of text", href: "/tools/qol/diff", status: "live" },
      { name: "Markdown Editor", description: "Write & preview Markdown", href: "/tools/qol/markdown", status: "live" },
      { name: "UUID Generator", description: "Generate unique identifiers", href: "/tools/qol/uuid", status: "live" },
      { name: "Pomodoro Timer", description: "Focus timer with breaks", href: "/tools/qol/pomodoro", status: "live" },
      { name: "Color Contrast Checker", description: "WCAG AA/AAA accessibility ratios", href: "/tools/qol/contrast", status: "live" },
      { name: "Cron Expression Builder", description: "Build and explain cron schedules", href: "/tools/qol/cron", status: "live" },
      { name: "Timestamp Converter", description: "Unix timestamp to/from human date", href: "/tools/qol/timestamp", status: "live" },
      { name: "Word Counter", description: "Count words, chars, sentences, reading time", href: "/tools/qol/word-count", status: "live" },
      { name: "Lorem Ipsum Generator", description: "Generate placeholder text", href: "/tools/qol/lorem", status: "live" },
      { name: "Aspect Ratio Calculator", description: "Calculate dimensions from any ratio", href: "/tools/qol/aspect-ratio", status: "live" },
      { name: "CSV Viewer", description: "Drag in a CSV and browse as a table", href: "/tools/qol/csv", status: "live" },
    ],
  },
  {
    id: "creative",
    label: "Creative & Art",
    description: "Color picker, pattern generator, pixel art canvas, font finder and mood board.",
    accent: "#FB923C",
    glowColor: "rgba(251,146,60,0.15)",
    icon: "+",
    tools: [
      { name: "Color Picker", description: "Hex / RGB / HSL converter", href: "/tools/creative/color", status: "live" },
      { name: "Pattern Generator", description: "CSS & SVG patterns", href: "/tools/creative/pattern", status: "live" },
      { name: "Pixel Art Maker", description: "Draw pixel art in browser", href: "/tools/creative/pixel", status: "live" },
      { name: "Font Finder", description: "Browse & pair free fonts", href: "/tools/creative/fonts", status: "live" },
      { name: "Mood Board", description: "Drag & drop mood board", href: "/tools/creative/moodboard", status: "live" },
    ],
  },
];

export const totalTools = categories.reduce((acc, cat) => acc + cat.tools.length, 0);
