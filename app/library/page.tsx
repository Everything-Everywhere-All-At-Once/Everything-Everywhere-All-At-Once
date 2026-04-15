"use client";

import Link from "next/link";
import { useState } from "react";

type Resource = {
  name: string;
  description: string;
  url: string;
  sub?: string;
};

type Section = {
  id: string;
  label: string;
  icon: string;
  accent: string;
  resources: Resource[];
};

const LIBRARY: Section[] = [
  {
    id: "ai",
    label: "AI Tools",
    icon: "◈",
    accent: "#00FFFF",
    resources: [
      // Chatbots
      { sub: "Chatbots", name: "ChatGPT", description: "OpenAI's flagship. GPT-4o and o-series. Most widely used LLM.", url: "https://chatgpt.com" },
      { sub: "Chatbots", name: "Claude", description: "Anthropic's assistant. Excellent reasoning, long context, and coding.", url: "https://claude.ai" },
      { sub: "Chatbots", name: "Gemini", description: "Google's AI. Flash model is unlimited free. Deep Google integration.", url: "https://gemini.google.com" },
      { sub: "Chatbots", name: "Google AI Studio", description: "Direct Gemini Pro access with API playground. Generous free tier.", url: "https://aistudio.google.com" },
      { sub: "Chatbots", name: "DeepSeek", description: "Open-source Chinese LLM rivaling frontier models. Unlimited free.", url: "https://chat.deepseek.com" },
      { sub: "Chatbots", name: "Microsoft Copilot", description: "GPT-4 backed. Unlimited use via Microsoft account.", url: "https://copilot.microsoft.com" },
      { sub: "Chatbots", name: "Meta AI", description: "Llama-based. Integrated into Instagram, WhatsApp, Facebook.", url: "https://www.meta.ai" },
      { sub: "Chatbots", name: "Qwen", description: "Alibaba's large models. Unlimited access to top-tier open models.", url: "https://chat.qwen.ai" },
      { sub: "Chatbots", name: "Kimi", description: "Long-context Chinese LLM with thinking mode. Generous free tier.", url: "https://www.kimi.com" },
      { sub: "Chatbots", name: "Groq", description: "Blazing fast inference for open models. Free API playground.", url: "https://console.groq.com/playground" },
      { sub: "Chatbots", name: "NVIDIA NIM", description: "Run frontier and open models via NVIDIA. No signup required.", url: "https://build.nvidia.com/models" },
      { sub: "Chatbots", name: "Cerebras Chat", description: "Ultra-fast LLM inference. Free daily usage.", url: "https://chat.cerebras.ai" },
      // Search / Research
      { sub: "Search & Research", name: "Perplexity", description: "AI-powered search with cited sources. Best AI search engine.", url: "https://www.perplexity.ai" },
      { sub: "Search & Research", name: "Brave Ask", description: "Privacy-focused AI search built into Brave Search.", url: "https://search.brave.com/ask" },
      { sub: "Search & Research", name: "NotebookLM", description: "Google's document analysis AI. Upload sources, ask questions.", url: "https://notebooklm.google.com" },
      { sub: "Search & Research", name: "SciSpace", description: "AI for reading and summarizing research papers.", url: "https://scispace.com" },
      { sub: "Search & Research", name: "Consensus", description: "AI search specifically for academic research papers.", url: "https://consensus.app" },
      // Local AI
      { sub: "Local & Self-Hosted", name: "Ollama", description: "Run any open LLM locally with one command. macOS/Linux/Windows.", url: "https://ollama.com" },
      { sub: "Local & Self-Hosted", name: "LM Studio", description: "Desktop app to download and run local models. Beginner-friendly.", url: "https://lmstudio.ai" },
      { sub: "Local & Self-Hosted", name: "Open WebUI", description: "Self-hosted chat interface. Connects to Ollama and APIs.", url: "https://openwebui.com" },
      { sub: "Local & Self-Hosted", name: "Jan", description: "Offline AI assistant that runs entirely on your machine.", url: "https://jan.ai" },
      { sub: "Local & Self-Hosted", name: "oobabooga", description: "Full-featured text generation web UI. Supports most model formats.", url: "https://github.com/oobabooga/text-generation-webui" },
      { sub: "Local & Self-Hosted", name: "KoboldCpp", description: "GUI for local LLM inference. Great CPU performance.", url: "https://github.com/LostRuins/koboldcpp" },
      // Image Generation
      { sub: "Image Generation", name: "Bing Image Creator", description: "Unlimited DALL-E image generation via Microsoft. No cost.", url: "https://www.bing.com/images/create" },
      { sub: "Image Generation", name: "Hunyuan Image", description: "Tencent's image model. Unlimited generation and editing.", url: "https://hunyuan.tencent.com/visual" },
      { sub: "Image Generation", name: "Perchance", description: "Unlimited AI photo generation. No account needed.", url: "https://perchance.org/ai-photo-generator" },
      { sub: "Image Generation", name: "ComfyUI", description: "Node-based local image generation. Most powerful SD frontend.", url: "https://www.comfy.org" },
      { sub: "Image Generation", name: "Automatic1111", description: "Feature-rich Stable Diffusion web UI. Industry standard.", url: "https://github.com/AUTOMATIC1111/stable-diffusion-webui" },
      { sub: "Image Generation", name: "Stability Matrix", description: "Unified launcher for ComfyUI, A1111, and other SD frontends.", url: "https://lykos.ai" },
      { sub: "Image Generation", name: "Fooocus", description: "Simplified SD interface. Colab supported. Great for beginners.", url: "https://github.com/lllyasviel/Fooocus" },
      // Audio & Video AI
      { sub: "Audio & Video AI", name: "ElevenLabs", description: "Best AI voice synthesis. Realistic TTS, voice cloning.", url: "https://elevenlabs.io" },
      { sub: "Audio & Video AI", name: "Suno", description: "AI music generation from text. 10 free songs daily.", url: "https://suno.com" },
      { sub: "Audio & Video AI", name: "Sonauto", description: "AI music generation. Unlimited free usage.", url: "https://sonauto.ai" },
      { sub: "Audio & Video AI", name: "MusicFX", description: "Google's music synthesis tool. Google Labs experiment.", url: "https://labs.google/fx/tools/music-fx" },
      { sub: "Audio & Video AI", name: "Stable Audio", description: "Stability AI's music generator. Monthly free credits.", url: "https://www.stableaudio.com" },
      { sub: "Audio & Video AI", name: "Kling", description: "High quality video generation. Daily free credits.", url: "https://klingai.com" },
      { sub: "Audio & Video AI", name: "HunyuanVideo", description: "Tencent's video model. Unlimited generation.", url: "https://hunyuan.tencent.com" },
      // Tools & Resources
      { sub: "Tools & Resources", name: "Hugging Face", description: "The hub for open-source AI — models, datasets, and demos.", url: "https://huggingface.co" },
      { sub: "Tools & Resources", name: "Artificial Analysis", description: "Benchmarks and comparisons for chatbots, image, and video models.", url: "https://artificialanalysis.ai" },
      { sub: "Tools & Resources", name: "AI Price Compare", description: "Compare LLM API pricing across every provider.", url: "https://countless.dev" },
      { sub: "Tools & Resources", name: "OpenRouter", description: "Unified API for 100+ models. Popularity rankings included.", url: "https://openrouter.ai" },
      { sub: "Tools & Resources", name: "LLM Explorer", description: "Database and comparison of all major LLMs.", url: "https://llm-explorer.com" },
    ],
  },
  {
    id: "video-streaming",
    label: "Video Streaming",
    icon: "▶",
    accent: "#F97316",
    resources: [
      // Free Legal
      { sub: "Free Legal", name: "Tubi", description: "Largest free legal streaming library. Ad-supported. No subscription.", url: "https://tubitv.com" },
      { sub: "Free Legal", name: "Pluto TV", description: "Free streaming with live TV channels and on-demand content.", url: "https://pluto.tv" },
      { sub: "Free Legal", name: "Peacock Free", description: "NBC's free tier. Movies, news, and select Peacock originals.", url: "https://www.peacocktv.com" },
      { sub: "Free Legal", name: "Plex", description: "Ad-supported free movies and TV. Also a great media server.", url: "https://watch.plex.tv" },
      { sub: "Free Legal", name: "Kanopy", description: "Free streaming through your library card. Criterion, documentaries.", url: "https://www.kanopy.com" },
      { sub: "Free Legal", name: "Hoopla", description: "Free with library card. Movies, TV, comics, ebooks, music.", url: "https://www.hoopladigital.com" },
      // Multi-source Streaming
      { sub: "Multi-Source Streaming", name: "Cineby", description: "Movies, TV, anime. Auto-next, clean UI, multiple servers.", url: "https://www.cineby.sc" },
      { sub: "Multi-Source Streaming", name: "Rive", description: "Movies, TV, anime. Auto-next with live status page.", url: "https://rivestream.org" },
      { sub: "Multi-Source Streaming", name: "Fmovies+", description: "Large library of movies, TV, and anime. Multi-server.", url: "https://www.fmovies.gd" },
      { sub: "Multi-Source Streaming", name: "XPrime", description: "Movies, TV, anime. Reliable auto-next.", url: "https://xprime.su" },
      { sub: "Multi-Source Streaming", name: "CorsFlix", description: "Movies, TV, anime streaming alternative.", url: "https://watch.corsflix.net" },
      { sub: "Multi-Source Streaming", name: "Flixer", description: "Multi-source movie and TV aggregator with auto-next.", url: "https://flixer.su" },
      { sub: "Multi-Source Streaming", name: "FlyX", description: "Multi-source streaming with auto-next.", url: "https://tv.vynx.cc" },
      { sub: "Multi-Source Streaming", name: "Filmex", description: "4K movies and TV aggregator with auto-next.", url: "https://filmex.to" },
      { sub: "Multi-Source Streaming", name: "PopcornMovies", description: "Movies, TV, anime streaming.", url: "https://popcornmovies.org" },
      { sub: "Multi-Source Streaming", name: "CinemaOS", description: "Movies, TV, anime with auto-next.", url: "https://cinemaos.live" },
      // Single Server
      { sub: "Single Server", name: "NEPU", description: "4K movies, TV, anime. High quality single source.", url: "https://nepu.to" },
      { sub: "Single Server", name: "SFlix", description: "Movies and TV. Clean interface, single server.", url: "https://sflix2.to" },
      { sub: "Single Server", name: "yFlix", description: "Movies, TV, anime. Auto-next capable.", url: "https://yflix.to" },
      { sub: "Single Server", name: "MovieBox", description: "Movies, TV, anime streaming.", url: "https://themoviebox.org" },
      // Anime
      { sub: "Anime", name: "Crunchyroll", description: "The largest legal anime streaming service. Large free catalogue.", url: "https://www.crunchyroll.com" },
      { sub: "Anime", name: "HiAnime", description: "Ad-supported anime streaming. Huge library, fast updates.", url: "https://hianime.to" },
      { sub: "Anime", name: "Gogoanime", description: "Classic anime streaming site. Vast library.", url: "https://gogoanime3.co" },
      { sub: "Anime", name: "Kaido", description: "Clean anime streaming. No ads with uBlock.", url: "https://kaido.to" },
      // Documentaries
      { sub: "Documentaries", name: "IHaveNoTV", description: "High-quality documentary streaming. No signup.", url: "https://ihavenotv.com" },
      { sub: "Documentaries", name: "Top Documentary Films", description: "Curated index of free documentary films across all topics.", url: "https://topdocumentaryfilms.com" },
      { sub: "Documentaries", name: "Documentary Heaven", description: "Large documentary collection. Free streaming.", url: "https://documentaryheaven.com" },
      { sub: "Documentaries", name: "Documentary Area", description: "Documentary streaming platform.", url: "https://www.documentaryarea.com" },
      { sub: "Documentaries", name: "NASA+", description: "Official NASA streaming. Space missions and science content.", url: "https://plus.nasa.gov" },
      { sub: "Documentaries", name: "PBS Video", description: "Official PBS. News, culture, nature, educational.", url: "https://www.pbs.org/video" },
      { sub: "Documentaries", name: "ARTE", description: "European cultural channel. Films and documentaries in EN/FR/DE.", url: "https://www.arte.tv" },
      { sub: "Documentaries", name: "Folkstreams", description: "American folk culture documentary archive.", url: "https://www.folkstreams.net" },
    ],
  },
  {
    id: "music",
    label: "Music & Audio",
    icon: "~",
    accent: "#A855F7",
    resources: [
      // Streaming
      { sub: "Streaming", name: "SoundCloud", description: "Independent and emerging artists. Vast free catalogue.", url: "https://soundcloud.com" },
      { sub: "Streaming", name: "Bandcamp", description: "Pay-what-you-want indie music. Stream free, download direct.", url: "https://bandcamp.com/discover/free-music" },
      { sub: "Streaming", name: "Spotify", description: "Biggest library. Free tier with ads and shuffle-only mobile.", url: "https://open.spotify.com" },
      { sub: "Streaming", name: "Deezer", description: "Browser streaming. Large library, free tier available.", url: "https://www.deezer.com" },
      { sub: "Streaming", name: "Audiomack", description: "Independent music platform. Hip-hop, afrobeats, reggae focus.", url: "https://audiomack.com" },
      { sub: "Streaming", name: "Audius", description: "Decentralized music platform. User-made and independent music.", url: "https://audius.co" },
      { sub: "Streaming", name: "Mirlo", description: "Free music release platform. Artist-first.", url: "https://mirlo.space" },
      { sub: "Streaming", name: "Newgrounds Audio", description: "Electronic music and game OSTs from the community.", url: "https://www.newgrounds.com/audio" },
      { sub: "Streaming", name: "Hype Machine", description: "Music blog aggregator. Trending tracks from across the web.", url: "https://hypem.com/popular" },
      { sub: "Streaming", name: "DAB Music Player", description: "Browser-based HiFi/lossless music player.", url: "https://dabmusic.xyz" },
      { sub: "Streaming", name: "Monochrome", description: "HiFi Tidal instance. Lossless streaming.", url: "https://monochrome.tf" },
      // Radio
      { sub: "Radio", name: "Radio Garden", description: "Spin a globe and tune into live radio from anywhere in the world.", url: "https://radio.garden" },
      { sub: "Radio", name: "SomaFM", description: "30+ listener-supported commercial-free online radio channels.", url: "https://somafm.com" },
      { sub: "Radio", name: "NTS Radio", description: "DJ-curated shows from around the globe. Stream free.", url: "https://www.nts.live" },
      { sub: "Radio", name: "RadioParadise", description: "Listener-supported online radio. Multiple streams, ad-free.", url: "https://radioparadise.com" },
      { sub: "Radio", name: "Jango", description: "Custom internet radio. Create stations from your favorite artists.", url: "https://jango.com" },
      { sub: "Radio", name: "Flow-Fi", description: "Lo-fi streaming service.", url: "https://www.flowfi.app" },
      { sub: "Radio", name: "CityHop", description: "Lo-fi radio paired with city walk videos.", url: "https://www.cityhop.cafe" },
      { sub: "Radio", name: "Chillhop", description: "The original lo-fi hip-hop platform.", url: "https://chillhop.com" },
      { sub: "Radio", name: "MTV Rewind", description: "Recreates the MTV experience from different eras.", url: "https://wantmymtv.xyz" },
      // Free Downloads
      { sub: "Free Downloads", name: "Free Music Archive", description: "High-quality CC-licensed music downloads across every genre.", url: "https://freemusicarchive.org" },
      { sub: "Free Downloads", name: "Freesound", description: "CC-licensed sound effects, field recordings, and samples.", url: "https://freesound.org" },
      { sub: "Free Downloads", name: "ccMixter", description: "Community remixes and original tracks under Creative Commons.", url: "https://ccmixter.org" },
      { sub: "Free Downloads", name: "Looperman", description: "Royalty-free loops, acapellas, and samples from producers.", url: "https://looperman.com" },
      { sub: "Free Downloads", name: "Zapsplat", description: "75,000+ free sound effects and royalty-free music tracks.", url: "https://zapsplat.com" },
      { sub: "Free Downloads", name: "Bensound", description: "Royalty-free background music for videos and media.", url: "https://bensound.com" },
      { sub: "Free Downloads", name: "AudionautiX", description: "Mood-based royalty-free music streaming and download.", url: "https://audionautix.com" },
      // Players & Tools
      { sub: "Players & Tools", name: "Foobar2000", description: "Feature-rich audio player for all platforms.", url: "https://www.foobar2000.org" },
      { sub: "Players & Tools", name: "MusicBee", description: "Lightweight audio manager and player for Windows.", url: "https://getmusicbee.com" },
      { sub: "Players & Tools", name: "AIMP", description: "Feature-rich audio player. Free, no ads.", url: "https://www.aimp.ru" },
      { sub: "Players & Tools", name: "Strawberry", description: "Open-source music player with lyrics and Last.fm support.", url: "https://www.strawberrymusicplayer.org" },
      { sub: "Players & Tools", name: "MP3Tag", description: "The best audio metadata organizer. Free for Windows.", url: "https://www.mp3tag.de/en" },
      { sub: "Players & Tools", name: "MusicBrainz Picard", description: "Auto-tag music files using fingerprint matching.", url: "https://picard.musicbrainz.org" },
      { sub: "Players & Tools", name: "Nuclear", description: "Unified streaming player — pulls from YouTube, SoundCloud, etc.", url: "https://nuclearplayer.com" },
      // Tracking
      { sub: "Tracking & Discovery", name: "Last.fm", description: "Track your listening habits and discover new music.", url: "https://www.last.fm" },
      { sub: "Tracking & Discovery", name: "RateYourMusic", description: "Rate, review, and discover music. Enormous database.", url: "https://rateyourmusic.com" },
      { sub: "Tracking & Discovery", name: "Discogs", description: "Vinyl and music database. Buy, sell, and catalogue records.", url: "https://www.discogs.com" },
      { sub: "Tracking & Discovery", name: "Tunefind", description: "Find songs from movies, TV shows, and games.", url: "https://www.tunefind.com" },
    ],
  },
  {
    id: "ebooks",
    label: "Ebooks & Reading",
    icon: "◎",
    accent: "#22C55E",
    resources: [
      // Main Libraries
      { sub: "Book Libraries", name: "Anna's Archive", description: "Largest open-source library mirror. Books, comics, papers, magazines.", url: "https://annas-archive.gl" },
      { sub: "Book Libraries", name: "Z-Library", description: "Millions of books and articles. Multiple mirrors and apps.", url: "https://z-lib.gd" },
      { sub: "Book Libraries", name: "Library Genesis", description: "Books and comics with search and multiple mirrors.", url: "https://libgen.li" },
      { sub: "Book Libraries", name: "Mobilism", description: "Books, audiobooks, magazines, comics. Forum with active community.", url: "https://forum.mobilism.org" },
      { sub: "Book Libraries", name: "Internet Archive (Texts)", description: "Millions of free books, magazines, and documents.", url: "https://archive.org/details/texts" },
      { sub: "Book Libraries", name: "MyAnonaMouse", description: "Books, audiobooks, comics, sheet music. Invite-only tracker.", url: "https://www.myanonamouse.net" },
      { sub: "Book Libraries", name: "Rave", description: "Multi-site book search engine. Searches all major sources at once.", url: "https://ravebooksearch.com" },
      { sub: "Book Libraries", name: "BookSee", description: "Book search and download. Clean interface.", url: "https://en.booksee.org" },
      // Public Domain
      { sub: "Public Domain", name: "Project Gutenberg", description: "70,000+ free public domain ebooks — classic literature and more.", url: "https://www.gutenberg.org" },
      { sub: "Public Domain", name: "Standard Ebooks", description: "Beautifully typeset, open-license public domain ebooks.", url: "https://standardebooks.org" },
      { sub: "Public Domain", name: "Open Library", description: "Borrow millions of books. Also hosts public domain titles.", url: "https://openlibrary.org" },
      { sub: "Public Domain", name: "Manybooks", description: "50,000+ free ebooks across formats.", url: "https://manybooks.net" },
      { sub: "Public Domain", name: "Unglue.it", description: "Public domain and open access ebooks.", url: "https://unglue.it" },
      { sub: "Public Domain", name: "DPLA", description: "Digital Public Library of America. Historical texts and documents.", url: "https://dp.la" },
      { sub: "Public Domain", name: "Wikisource", description: "Wikimedia's free text library. Millions of source texts.", url: "https://wikisource.org" },
      // PDF Search
      { sub: "PDF Search", name: "Ocean of PDF", description: "Books and comics PDF directory. Simple search.", url: "https://oceanofpdf.com" },
      { sub: "PDF Search", name: "PDFRoom", description: "Books and comics in PDF format.", url: "https://pdfroom.com" },
      { sub: "PDF Search", name: "PDFCoffee", description: "Books and documents in PDF format.", url: "https://pdfcoffee.com" },
      // Audiobooks
      { sub: "Audiobooks", name: "Librivox", description: "Free public domain audiobooks recorded by volunteers.", url: "https://librivox.org" },
      { sub: "Audiobooks", name: "Tokybook", description: "Audiobook streaming and reading. No signup required.", url: "https://tokybook.com" },
      { sub: "Audiobooks", name: "AudiobookBay", description: "Audiobook torrents. Large catalogue.", url: "https://audiobookbay.lu" },
      { sub: "Audiobooks", name: "LearnOutLoud", description: "Free audiobook directory. Well-organized by category.", url: "https://www.learnoutloud.com/Free-Audiobooks" },
      { sub: "Audiobooks", name: "Storynory", description: "Children's audio stories. Free to stream.", url: "https://www.storynory.com" },
      { sub: "Audiobooks", name: "AudiobookShelf", description: "Self-hosted audiobook and podcast server.", url: "https://www.audiobookshelf.org" },
      // Ebook Readers
      { sub: "Ebook Readers & Tools", name: "Calibre", description: "The essential ebook manager — organize, convert, and sync to any device.", url: "https://calibre-ebook.com" },
      { sub: "Ebook Readers & Tools", name: "KOReader", description: "Feature-rich ebook reader with plugins. All major formats.", url: "https://koreader.rocks" },
      { sub: "Ebook Readers & Tools", name: "Koodo", description: "Clean multi-platform ebook reader.", url: "https://www.koodoreader.com" },
      { sub: "Ebook Readers & Tools", name: "Thorium", description: "EPUB reader. DAISY and accessibility support.", url: "https://thorium.edrlab.org" },
      { sub: "Ebook Readers & Tools", name: "Readest", description: "Modern cross-platform ebook reader.", url: "https://readest.com" },
      { sub: "Ebook Readers & Tools", name: "Readarr", description: "Auto-download books. Integrates with download clients.", url: "https://readarr.com" },
      { sub: "Ebook Readers & Tools", name: "DeDRM Tools", description: "Remove DRM from ebooks so you can actually own them.", url: "https://github.com/noDRM/DeDRM_tools" },
      // Light Novels
      { sub: "Light Novels & Web Fiction", name: "Royal Road", description: "Web novels and serialized fiction. Huge English-language community.", url: "https://www.royalroad.com" },
      { sub: "Light Novels & Web Fiction", name: "Scribble Hub", description: "Web novels and original stories. Huge catalogue.", url: "https://www.scribblehub.com" },
      { sub: "Light Novels & Web Fiction", name: "Archive of Our Own", description: "Fanfiction archive with powerful tagging and community features.", url: "https://archiveofourown.org" },
      { sub: "Light Novels & Web Fiction", name: "Fanfiction.net", description: "Classic fanfiction archive. Massive library.", url: "https://www.fanfiction.net" },
      { sub: "Light Novels & Web Fiction", name: "Wuxiaworld", description: "Chinese web novel translations. Wuxia and xianxia focus.", url: "https://www.wuxiaworld.com" },
      { sub: "Light Novels & Web Fiction", name: "NovelFire", description: "Online light novel reading. Clean interface.", url: "https://novelfire.net" },
      // Tracking
      { sub: "Tracking & Discovery", name: "GoodReads", description: "Book tracking, reviews, and recommendations. Most popular.", url: "https://www.goodreads.com" },
      { sub: "Tracking & Discovery", name: "StoryGraph", description: "GoodReads alternative. Better analytics and mood tracking.", url: "https://www.thestorygraph.com" },
      { sub: "Tracking & Discovery", name: "Five Books", description: "Expert-curated book recommendations by topic.", url: "https://fivebooks.com" },
      { sub: "Tracking & Discovery", name: "The Greatest Books", description: "Algorithm-based best books ranking across lists.", url: "https://www.thegreatestbooks.org" },
    ],
  },
  {
    id: "comics",
    label: "Comics & Manga",
    icon: "◻",
    accent: "#EC4899",
    resources: [
      // Manga
      { sub: "Manga", name: "MangaDex", description: "Gold standard manga reader. Community scanlations, great UI, tracking.", url: "https://mangadex.org" },
      { sub: "Manga", name: "MangaFire", description: "Clean, fast manga reader. Large library, regular updates.", url: "https://mangafire.to" },
      { sub: "Manga", name: "MangaNato", description: "Large manga reading site. Fast and reliable.", url: "https://www.manganato.gg" },
      { sub: "Manga", name: "MangaBuddy", description: "Manga reading platform. Large catalogue.", url: "https://mangabuddy.com" },
      { sub: "Manga", name: "MangaPill", description: "Manga reader proxy. Pulls from multiple sources.", url: "https://mangapill.com" },
      { sub: "Manga", name: "All Manga", description: "Multi-source manga aggregator.", url: "https://allmanga.to" },
      { sub: "Manga", name: "Cubari Proxy", description: "Multi-site manga web client. Great for archived series.", url: "https://proxy.cubari.moe" },
      { sub: "Manga", name: "MangaHub", description: "Large manga platform with good search.", url: "https://mangahub.io" },
      { sub: "Manga", name: "MangaUpdates", description: "Manga release tracker and database. The definitive resource.", url: "https://www.mangaupdates.com" },
      { sub: "Manga", name: "Nyaa (Manga)", description: "Manga and LN torrent tracker. Best for batch downloads.", url: "https://nyaa.si/?f=0&c=3_0&q=" },
      // Manhwa / Manhua
      { sub: "Manhwa & Manhua", name: "Webtoon", description: "Official platform for webtoons from major publishers and indie creators.", url: "https://www.webtoons.com" },
      { sub: "Manhwa & Manhua", name: "Toonily", description: "Manhwa reading platform. Large catalogue.", url: "https://toonily.com" },
      { sub: "Manhwa & Manhua", name: "ManhwaClan", description: "Manhwa reading platform.", url: "https://manhwaclan.com" },
      { sub: "Manhwa & Manhua", name: "AquaReader", description: "Manhua reader with large catalogue.", url: "https://aquareader.net" },
      { sub: "Manhwa & Manhua", name: "Weeb Central", description: "Manga, manhwa, and manhua aggregator.", url: "https://weebcentral.com" },
      // Comics
      { sub: "Comics", name: "GetComics", description: "Download comics in CBZ/PDF. Large mainstream and indie catalogue.", url: "https://getcomics.org" },
      { sub: "Comics", name: "ReadComicsOnline", description: "Read comics in browser. Large selection across publishers.", url: "https://readcomiconline.li" },
      { sub: "Comics", name: "ComicBookPlus", description: "Thousands of golden age comics. Public domain, fully legal.", url: "https://comicbookplus.com" },
      { sub: "Comics", name: "Digital Comic Museum", description: "Golden age comics archive. Public domain.", url: "https://digitalcomicmuseum.com" },
      { sub: "Comics", name: "GoComics", description: "Official daily comic strips — Calvin & Hobbes, Peanuts, Garfield.", url: "https://www.gocomics.com" },
      { sub: "Comics", name: "Comics Kingdom", description: "Classic comic strips. King Features titles.", url: "https://comicskingdom.com" },
      { sub: "Comics", name: "SMBC", description: "Science and philosophy webcomic. Daily updates.", url: "https://www.smbc-comics.com" },
      { sub: "Comics", name: "xkcd", description: "Legendary math, science, and internet culture webcomic.", url: "https://xkcd.com" },
      { sub: "Comics", name: "The Oatmeal", description: "Humor webcomics. Viral and irreverent.", url: "https://theoatmeal.com" },
      { sub: "Comics", name: "Explosm (C&H)", description: "Cyanide & Happiness. Dark humor webcomics.", url: "https://explosm.net/rcg" },
      // Tracking
      { sub: "Tracking", name: "MyAnimeList", description: "Manga and anime tracking database. Most popular.", url: "https://myanimelist.net" },
      { sub: "Tracking", name: "Anilist", description: "Manga and anime tracking. Clean UI, great stats.", url: "https://anilist.co" },
      { sub: "Tracking", name: "LeagueOfComicGeeks", description: "Comic tracking database. New issue notifications.", url: "https://leagueofcomicgeeks.com" },
    ],
  },
  {
    id: "academic",
    label: "Academic & Research",
    icon: "⬡",
    accent: "#6366F1",
    resources: [
      // Paper Access
      { sub: "Paper Access", name: "Sci-Hub", description: "Removes paywalls from any academic paper. Works for almost everything.", url: "https://sci-hub.se" },
      { sub: "Paper Access", name: "Anna's Archive", description: "Includes papers and books. Mirrors Sci-Hub and LibGen.", url: "https://annas-archive.gl" },
      { sub: "Paper Access", name: "Unpaywall", description: "Browser extension that finds legal free versions of paywalled papers.", url: "https://unpaywall.org" },
      // Search
      { sub: "Search", name: "Google Scholar", description: "Search across papers, theses, books, and court opinions.", url: "https://scholar.google.com" },
      { sub: "Search", name: "Semantic Scholar", description: "AI-powered academic search. Citation graphs and summaries.", url: "https://www.semanticscholar.org" },
      { sub: "Search", name: "BASE", description: "Bielefeld Academic Search Engine. 300M+ documents.", url: "https://www.base-search.net" },
      { sub: "Search", name: "Dimensions", description: "Research, grant, and patent database.", url: "https://app.dimensions.ai/discover/publication" },
      { sub: "Search", name: "Consensus", description: "AI search specifically over research papers. Summarizes evidence.", url: "https://consensus.app" },
      { sub: "Search", name: "Connected Papers", description: "Visualize relationships between academic papers.", url: "https://www.connectedpapers.com" },
      { sub: "Search", name: "Paper Panda", description: "Search and access research papers. Finds open access copies.", url: "https://paperpanda.app" },
      { sub: "Search", name: "Internet Archive Scholar", description: "Search millions of papers hosted by the Archive.", url: "https://scholar.archive.org" },
      { sub: "Search", name: "Open Knowledge Maps", description: "Visualize research paper landscapes by topic.", url: "https://openknowledgemaps.org" },
      // Preprints & Open Access
      { sub: "Preprints & Open Access", name: "arXiv", description: "Cornell preprint server. Physics, math, CS, economics.", url: "https://arxiv.org" },
      { sub: "Preprints & Open Access", name: "PubMed", description: "30M+ biomedical citations. The standard for medical research.", url: "https://pubmed.ncbi.nlm.nih.gov" },
      { sub: "Preprints & Open Access", name: "PubMed Central", description: "Full-text biomedical journal archive.", url: "https://pmc.ncbi.nlm.nih.gov" },
      { sub: "Preprints & Open Access", name: "medRxiv", description: "Medical research preprints. Before peer review.", url: "https://www.medrxiv.org" },
      { sub: "Preprints & Open Access", name: "bioRxiv", description: "Biology preprints. Rapidly growing catalogue.", url: "https://www.biorxiv.org" },
      { sub: "Preprints & Open Access", name: "SSRN", description: "Social science, law, and economics preprints.", url: "https://www.ssrn.com" },
      { sub: "Preprints & Open Access", name: "PsyArXiv", description: "Psychology and cognitive science preprints.", url: "https://psyarxiv.com" },
      { sub: "Preprints & Open Access", name: "Zenodo", description: "Open research repository. Any discipline.", url: "https://zenodo.org" },
      { sub: "Preprints & Open Access", name: "DOAJ", description: "Directory of open access journals. 20,000+ journals.", url: "https://doaj.org" },
      // Textbooks & Books
      { sub: "Textbooks & Free Books", name: "OpenStax", description: "Peer-reviewed free textbooks for college courses. Used by millions.", url: "https://openstax.org" },
      { sub: "Textbooks & Free Books", name: "Open Textbook Library", description: "University of Minnesota open textbook collection.", url: "https://open.umn.edu/opentextbooks" },
      { sub: "Textbooks & Free Books", name: "Free Programming Books", description: "GitHub index of thousands of free programming books.", url: "https://ebookfoundation.github.io/free-programming-books-search" },
      { sub: "Textbooks & Free Books", name: "GoalKicker", description: "Free programming cheatsheets compiled from Stack Overflow.", url: "https://goalkicker.com" },
      { sub: "Textbooks & Free Books", name: "LibreTexts", description: "Open educational content. STEM focus.", url: "https://commons.libretexts.org" },
      { sub: "Textbooks & Free Books", name: "AcademicTorrents", description: "Torrent tracker for academic papers and datasets.", url: "https://academictorrents.com" },
      { sub: "Textbooks & Free Books", name: "JSTOR", description: "Academic journals, books, and primary sources. Audit free.", url: "https://www.jstor.org" },
      { sub: "Textbooks & Free Books", name: "Springer Open Access", description: "Open access books from Springer publisher.", url: "https://link.springer.com/search?showAll=false&query=&facet-content-type=%22Book%22" },
    ],
  },
  {
    id: "privacy",
    label: "Privacy & Security",
    icon: "⬢",
    accent: "#FF3399",
    resources: [
      // Adblockers
      { sub: "Adblockers", name: "uBlock Origin", description: "The most effective browser adblocker. Open-source, no telemetry.", url: "https://github.com/gorhill/uBlock" },
      { sub: "Adblockers", name: "AdGuard", description: "Browser extension adblocker with extra privacy features.", url: "https://github.com/AdguardTeam/AdguardBrowserExtension" },
      { sub: "Adblockers", name: "SponsorBlock", description: "Skip sponsored segments in YouTube videos. Community-driven.", url: "https://sponsor.ajay.app" },
      { sub: "Adblockers", name: "FilterLists", description: "Directory of all adblock and tracker filter lists.", url: "https://filterlists.com" },
      { sub: "Adblockers", name: "Pi-Hole", description: "Self-hosted DNS-level ad blocking for your whole network.", url: "https://pi-hole.net" },
      { sub: "Adblockers", name: "AdGuard Home", description: "Self-hosted network-wide DNS filtering. Pi-Hole alternative.", url: "https://adguard.com/en/adguard-home/overview.html" },
      { sub: "Adblockers", name: "NextDNS", description: "Customizable cloud DNS blocking. Free tier available.", url: "https://nextdns.io" },
      // VPNs
      { sub: "VPNs", name: "Proton VPN", description: "Free VPN with no data cap. Swiss privacy laws. No logs.", url: "https://protonvpn.com" },
      { sub: "VPNs", name: "Windscribe", description: "10GB monthly free tier. Good privacy practices.", url: "https://windscribe.com" },
      { sub: "VPNs", name: "Mullvad VPN", description: "Privacy-focused paid VPN. Anonymous accounts. No email required.", url: "https://mullvad.net" },
      { sub: "VPNs", name: "IVPN", description: "No-log VPN. Strong privacy stance. Anonymous payments.", url: "https://www.ivpn.net" },
      // Browsers
      { sub: "Private Browsers", name: "Firefox", description: "Open-source browser. Best with uBlock Origin and hardened settings.", url: "https://www.mozilla.org/firefox" },
      { sub: "Private Browsers", name: "Brave", description: "Chromium-based with built-in ad blocking and privacy features.", url: "https://brave.com" },
      { sub: "Private Browsers", name: "Librewolf", description: "Firefox fork pre-hardened for privacy. No telemetry.", url: "https://librewolf.net" },
      { sub: "Private Browsers", name: "Tor Browser", description: "Routes traffic through Tor. Maximum anonymity.", url: "https://www.torproject.org" },
      // Messengers
      { sub: "Encrypted Messengers", name: "Signal", description: "The gold standard for encrypted messaging. End-to-end by default.", url: "https://signal.org" },
      { sub: "Encrypted Messengers", name: "SimpleX Chat", description: "Fully decentralized. No user IDs, no phone number required.", url: "https://simplex.chat" },
      { sub: "Encrypted Messengers", name: "Matrix / Element", description: "Decentralized, federated messaging protocol.", url: "https://matrix.org/ecosystem/clients/" },
      { sub: "Encrypted Messengers", name: "Briar", description: "P2P encrypted messaging. Works without internet via Bluetooth.", url: "https://briarproject.org" },
      // Email
      { sub: "Private Email", name: "Proton Mail", description: "Zero-access encrypted email. Swiss privacy. Free plan available.", url: "https://proton.me/mail" },
      { sub: "Private Email", name: "Tuta", description: "End-to-end encrypted email. Open-source. Free tier.", url: "https://tuta.com" },
      { sub: "Private Email", name: "SimpleLogin", description: "Email aliasing service. Mask your real address.", url: "https://simplelogin.io" },
      // Search
      { sub: "Private Search", name: "DuckDuckGo", description: "Privacy-first metasearch. No tracking, no profiling.", url: "https://duckduckgo.com" },
      { sub: "Private Search", name: "Brave Search", description: "Independent index. Not built on Google or Bing.", url: "https://search.brave.com" },
      { sub: "Private Search", name: "SearXNG", description: "Self-hostable metasearch aggregator. Fully open-source.", url: "https://docs.searxng.org" },
      { sub: "Private Search", name: "Startpage", description: "Google results without the Google tracking.", url: "https://www.startpage.com" },
      // Tools
      { sub: "Security Tools", name: "Have I Been Pwned", description: "Check if your email or password appeared in a data breach.", url: "https://haveibeenpwned.com" },
      { sub: "Security Tools", name: "VirusTotal", description: "Scan files and URLs against 70+ antivirus engines.", url: "https://www.virustotal.com" },
      { sub: "Security Tools", name: "Malwarebytes", description: "Industry-leading malware and adware detection.", url: "https://www.malwarebytes.com" },
      { sub: "Security Tools", name: "GnuPG", description: "Open-source encryption and signing. Email and file security.", url: "https://gnupg.org" },
      { sub: "Security Tools", name: "PrivNote", description: "Self-destructing encrypted notes. Share secrets safely.", url: "https://privnote.com" },
      { sub: "Security Tools", name: "Whonix", description: "Privacy-focused OS. Isolates your identity through Tor.", url: "https://www.whonix.org" },
    ],
  },
  {
    id: "foss",
    label: "FOSS & Software",
    icon: "◇",
    accent: "#F97316",
    resources: [
      // Directories
      { sub: "Directories & Discovery", name: "AlternativeTo", description: "Find free and open-source alternatives to any app or service.", url: "https://alternativeto.net" },
      { sub: "Directories & Discovery", name: "OpenAlternative", description: "Curated open-source alternatives to popular tools.", url: "https://openalternative.co" },
      { sub: "Directories & Discovery", name: "Awesome Open Source", description: "Curated indexes of the best open-source projects in every category.", url: "https://awesomeopensource.com" },
      { sub: "Directories & Discovery", name: "SourceForge", description: "Long-running FOSS repository. Millions of projects.", url: "https://sourceforge.net" },
      { sub: "Directories & Discovery", name: "FossHub", description: "Clean, safe downloads for popular free and open-source software.", url: "https://www.fosshub.com" },
      { sub: "Directories & Discovery", name: "Free Software Directory", description: "FSF's directory of free software.", url: "https://directory.fsf.org" },
      { sub: "Directories & Discovery", name: "OSS Gallery", description: "Gallery of open-source projects.", url: "https://oss.gallery" },
      // Freeware
      { sub: "Freeware Downloads", name: "MajorGeeks", description: "Trusted freeware and shareware downloads since 2001.", url: "https://www.majorgeeks.com" },
      { sub: "Freeware Downloads", name: "Softpedia", description: "Large freeware directory with reviews.", url: "https://www.softpedia.com" },
      { sub: "Freeware Downloads", name: "PortableApps", description: "Run software from a USB drive. No installation needed.", url: "https://portableapps.com" },
      { sub: "Freeware Downloads", name: "PortableFreeware", description: "Catalog of portable freeware apps.", url: "https://www.portablefreeware.com" },
      { sub: "Freeware Downloads", name: "Nirsoft", description: "Collection of small Windows utilities. All free.", url: "https://www.nirsoft.net" },
      { sub: "Freeware Downloads", name: "OlderGeeks", description: "Freeware downloads, especially older versions.", url: "https://oldergeeks.com" },
      // Archive
      { sub: "Archive & Preservation", name: "Internet Archive", description: "Software, games, ROMs, books, the Wayback Machine. Essential.", url: "https://archive.org" },
      { sub: "Archive & Preservation", name: "Software Heritage", description: "Archives all public source code. Permanent preservation.", url: "https://www.softwareheritage.org" },
      { sub: "Archive & Preservation", name: "VETUSWARE", description: "Abandonware, old operating systems, and vintage games.", url: "https://vetusware.com" },
      { sub: "Archive & Preservation", name: "OldVersion", description: "Download older versions of popular software.", url: "http://www.oldversion.com" },
      // Download Sites
      { sub: "Download Sites", name: "SoftArchive", description: "Software, audio, books, comics, and magazines downloads.", url: "https://softarchive.download" },
      { sub: "Download Sites", name: "1DDL", description: "Audio, books, comics, and magazines downloads.", url: "https://1ddl.org" },
      { sub: "Download Sites", name: "Novanon", description: "Audio, magazines, comics, books, and courses.", url: "https://novanon.net" },
    ],
  },
  {
    id: "linux",
    label: "Linux & macOS",
    icon: "⬟",
    accent: "#FFFF00",
    resources: [
      // Guides & Docs
      { sub: "Guides & Documentation", name: "ArchWiki", description: "Most comprehensive Linux documentation. Useful for any distro.", url: "https://wiki.archlinux.org" },
      { sub: "Guides & Documentation", name: "Gentoo Wiki", description: "Detailed documentation for Gentoo and source-based systems.", url: "https://wiki.gentoo.org" },
      { sub: "Guides & Documentation", name: "Debian Wiki", description: "Debian-specific guides and documentation.", url: "https://wiki.debian.org" },
      { sub: "Guides & Documentation", name: "LinuxJourney", description: "Interactive Linux learning platform for beginners.", url: "https://labex.io/linuxjourney" },
      { sub: "Guides & Documentation", name: "Linux Roadmap", description: "Visual learning pathway for Linux skills.", url: "https://roadmap.sh/linux" },
      // CLI
      { sub: "CLI Reference", name: "Linux Command Library", description: "Searchable reference for every Linux command with examples.", url: "https://linuxcommandlibrary.com" },
      { sub: "CLI Reference", name: "CommandlineFU", description: "Community shell one-liners. Thousands of clever commands.", url: "https://www.commandlinefu.com" },
      { sub: "CLI Reference", name: "cheat.sh", description: "Cheatsheets for any CLI tool, from the terminal.", url: "https://cheat.sh" },
      { sub: "CLI Reference", name: "Bash Academy", description: "Shell scripting instruction. From basics to advanced.", url: "https://guide.bash.academy" },
      { sub: "CLI Reference", name: "Bash Oneliner", description: "Collection of useful bash one-liners.", url: "https://onceupon.github.io/Bash-Oneliner/" },
      { sub: "CLI Reference", name: "ss64 Bash", description: "Alphabetical bash command reference with examples.", url: "https://ss64.com/bash/" },
      // Distros
      { sub: "Distros & Tools", name: "DistroWatch", description: "Distro index with news, rankings, and package search.", url: "https://distrowatch.com" },
      { sub: "Distros & Tools", name: "Homebrew", description: "The missing package manager for macOS and Linux.", url: "https://brew.sh" },
      { sub: "Distros & Tools", name: "Repology", description: "Track package versions across 350+ repos and distros.", url: "https://repology.org" },
      { sub: "Distros & Tools", name: "ExplainShell", description: "Paste a command and get a breakdown of every flag.", url: "https://explainshell.com" },
      // Communities
      { sub: "Communities", name: "LinuxQuestions", description: "Long-running Q&A forum. Every distro covered.", url: "https://www.linuxquestions.org/questions/" },
      { sub: "Communities", name: "Arch Forums", description: "Technical discussion for Arch users. Helpful and detailed.", url: "https://bbs.archlinux.org" },
      { sub: "Communities", name: "All Things Linux Discord", description: "Large Linux Discord community.", url: "https://discord.gg/linux" },
    ],
  },
  {
    id: "educational",
    label: "Educational & Courses",
    icon: "△",
    accent: "#A855F7",
    resources: [
      // Courses
      { sub: "Courses", name: "Khan Academy", description: "Free world-class education from K-12 to college. No ads, no paywall.", url: "https://www.khanacademy.org" },
      { sub: "Courses", name: "MIT OpenCourseWare", description: "Free lecture notes, exams, and videos from 2,500+ MIT courses.", url: "https://ocw.mit.edu" },
      { sub: "Courses", name: "CS50", description: "Harvard's legendary intro to CS. Free to take, certificate included.", url: "https://cs50.harvard.edu" },
      { sub: "Courses", name: "edX", description: "University courses from MIT, Harvard, and 250+ institutions. Audit free.", url: "https://www.edx.org" },
      { sub: "Courses", name: "Coursera", description: "Courses from top universities. Most can be audited for free.", url: "https://www.coursera.org" },
      { sub: "Courses", name: "freeCodeCamp", description: "Full coding curriculum, free forever. Certifications included.", url: "https://www.freecodecamp.org" },
      { sub: "Courses", name: "The Odin Project", description: "Full-stack web dev curriculum. Open-source, community-built.", url: "https://www.theodinproject.com" },
      { sub: "Courses", name: "fast.ai", description: "Practical deep learning for coders. Free course and notebooks.", url: "https://course.fast.ai" },
      { sub: "Courses", name: "DeepLearning.ai", description: "ML and AI specializations by Andrew Ng. Many audit for free.", url: "https://www.deeplearning.ai" },
      { sub: "Courses", name: "roadmap.sh", description: "Visual, community-driven learning roadmaps for every dev role.", url: "https://roadmap.sh" },
      { sub: "Courses", name: "LearnOutLoud", description: "Free learning resources across audio and video.", url: "https://www.learnoutloud.com" },
      // Documentaries
      { sub: "Documentaries", name: "IHaveNoTV", description: "High-quality documentary streaming. No signup needed.", url: "https://ihavenotv.com" },
      { sub: "Documentaries", name: "Top Documentary Films", description: "Curated index of free documentaries across all topics.", url: "https://topdocumentaryfilms.com" },
      { sub: "Documentaries", name: "Documentary Heaven", description: "Large free documentary collection.", url: "https://documentaryheaven.com" },
      { sub: "Documentaries", name: "PBS Video", description: "Official PBS. News, culture, nature, science content.", url: "https://www.pbs.org/video" },
      { sub: "Documentaries", name: "Thought Maybe", description: "Curated social and political documentaries.", url: "https://thoughtmaybe.com" },
      { sub: "Documentaries", name: "Films for Action", description: "Social change documentary platform.", url: "https://www.filmsforaction.org" },
      { sub: "Documentaries", name: "NASA+", description: "Space missions, science, and NASA originals. Free.", url: "https://plus.nasa.gov" },
      // Reference
      { sub: "Reference", name: "Wikipedia", description: "The free encyclopedia. 60M+ articles.", url: "https://en.wikipedia.org" },
      { sub: "Reference", name: "Wikiversity", description: "Learning resources and courses built on Wikimedia.", url: "https://www.wikiversity.org" },
      { sub: "Reference", name: "Wikibooks", description: "User-created textbooks on every subject.", url: "https://wikibooks.org" },
      { sub: "Reference", name: "World History Encyclopedia", description: "Scholarly history articles, all free.", url: "https://www.worldhistory.org" },
      { sub: "Reference", name: "Encyclopedia Britannica", description: "Classic reference. Limited free access.", url: "https://www.britannica.com" },
    ],
  },
  {
    id: "images",
    label: "Free Images",
    icon: "⬕",
    accent: "#C055FF",
    resources: [
      { sub: "Stock Photos", name: "Unsplash", description: "Beautiful free photos. CC0 license. Used everywhere.", url: "https://unsplash.com" },
      { sub: "Stock Photos", name: "Pexels", description: "Free stock photos and videos from talented creators.", url: "https://pexels.com" },
      { sub: "Stock Photos", name: "Pixabay", description: "4M+ free stock images, vectors, and videos. CC0.", url: "https://pixabay.com" },
      { sub: "Stock Photos", name: "Reshot", description: "Authentic, unique free stock photos. No typical stock cheese.", url: "https://reshot.com" },
      { sub: "Stock Photos", name: "StockSnap", description: "High-res CC0 photos added weekly.", url: "https://stocksnap.io" },
      { sub: "Stock Photos", name: "Wikimedia Commons", description: "Freely usable images — history, science, art, and more.", url: "https://commons.wikimedia.org" },
      { sub: "Stock Photos", name: "Life of Pix", description: "Free high-res photos. No copyright restrictions.", url: "https://www.lifeofpix.com" },
      { sub: "Illustrations & Vectors", name: "unDraw", description: "Open-source illustrations. Customizable SVGs for any project.", url: "https://undraw.co" },
      { sub: "Illustrations & Vectors", name: "Storyset", description: "Customizable free illustrations. Animated versions available.", url: "https://storyset.com" },
      { sub: "Illustrations & Vectors", name: "Humaaans", description: "Mix-and-match illustration library of people.", url: "https://www.humaaans.com" },
      { sub: "Illustrations & Vectors", name: "Blush", description: "Customizable illustrations from artists worldwide.", url: "https://blush.design" },
      { sub: "Illustrations & Vectors", name: "Open Peeps", description: "Hand-drawn illustration library. Free for commercial use.", url: "https://www.openpeeps.com" },
    ],
  },
  {
    id: "fonts",
    label: "Fonts",
    icon: "Aa",
    accent: "#EC4899",
    resources: [
      { sub: "Directories", name: "Google Fonts", description: "1,500+ open-source font families. Free for commercial use.", url: "https://fonts.google.com" },
      { sub: "Directories", name: "Font Squirrel", description: "Free commercially-licensed fonts. Also has webfont generator.", url: "https://fontsquirrel.com" },
      { sub: "Directories", name: "DaFont", description: "Huge collection of free fonts by category. Check license.", url: "https://dafont.com" },
      { sub: "Directories", name: "Fontesk", description: "Curated modern fonts for designers.", url: "https://fontesk.com" },
      { sub: "Directories", name: "The League of Moveable Type", description: "Open-source type foundry. High-quality, free typefaces.", url: "https://theleagueofmoveabletype.com" },
      { sub: "Directories", name: "Fontshare", description: "Free fonts from Indian Type Foundry. Very high quality.", url: "https://www.fontshare.com" },
      { sub: "Directories", name: "Font Library", description: "Open Font License fonts only. Commercial safe.", url: "https://fontlibrary.org" },
      { sub: "Tools", name: "WhatFont", description: "Browser extension to identify any font on any website.", url: "https://www.chengyinliu.com/whatfont.html" },
      { sub: "Tools", name: "FontDrop", description: "Preview and analyze font files in your browser.", url: "https://fontdrop.info" },
      { sub: "Tools", name: "Font Identifier", description: "Upload an image to identify the font.", url: "https://www.fontsquirrel.com/matcherator" },
    ],
  },
  {
    id: "icons",
    label: "Icons & Vectors",
    icon: "+",
    accent: "#22C55E",
    resources: [
      { sub: "Icon Sets", name: "Heroicons", description: "Hand-crafted SVG icons by the Tailwind team. MIT licensed.", url: "https://heroicons.com" },
      { sub: "Icon Sets", name: "Lucide", description: "Clean, consistent icon set. 1,000+ icons. MIT licensed.", url: "https://lucide.dev" },
      { sub: "Icon Sets", name: "Phosphor Icons", description: "Flexible icons with 6 weights and 1,200+ icons. MIT.", url: "https://phosphoricons.com" },
      { sub: "Icon Sets", name: "Tabler Icons", description: "3,700+ free MIT-licensed SVG icons.", url: "https://tabler-icons.io" },
      { sub: "Icon Sets", name: "Feather Icons", description: "Simply beautiful open-source icons. Clean and minimal.", url: "https://feathericons.com" },
      { sub: "Icon Sets", name: "Remix Icon", description: "2,800+ open-source icons. Free for personal and commercial.", url: "https://remixicon.com" },
      { sub: "Icon Sets", name: "Bootstrap Icons", description: "1,800+ open-source SVG icons from Bootstrap.", url: "https://icons.getbootstrap.com" },
      { sub: "Icon Sets", name: "Material Icons", description: "Google's Material Design icon set. 2,500+ icons.", url: "https://fonts.google.com/icons" },
      { sub: "Large Databases", name: "SVG Repo", description: "500,000+ open-licensed SVG icons and vectors.", url: "https://svgrepo.com" },
      { sub: "Large Databases", name: "Flaticon", description: "Largest database of free icons in PNG and SVG.", url: "https://flaticon.com" },
      { sub: "Large Databases", name: "Iconify", description: "Universal icon framework. 200,000+ icons from 150+ sets.", url: "https://iconify.design" },
      { sub: "Large Databases", name: "Simple Icons", description: "2,900+ free SVG icons for popular brands.", url: "https://simpleicons.org" },
    ],
  },
  {
    id: "dev",
    label: "Dev Resources",
    icon: "⬢",
    accent: "#6366F1",
    resources: [
      // Reference
      { sub: "Reference", name: "MDN Web Docs", description: "Definitive reference for HTML, CSS, and JavaScript.", url: "https://developer.mozilla.org" },
      { sub: "Reference", name: "DevDocs", description: "Unified offline API documentation for 300+ libraries.", url: "https://devdocs.io" },
      { sub: "Reference", name: "Can I Use", description: "Browser support tables for modern web features.", url: "https://caniuse.com" },
      { sub: "Reference", name: "GoalKicker", description: "Free programming cheatsheets from Stack Overflow docs.", url: "https://goalkicker.com" },
      { sub: "Reference", name: "Free Programming Books", description: "Index of thousands of free programming books.", url: "https://ebookfoundation.github.io/free-programming-books-search" },
      { sub: "Reference", name: "RegexLearn", description: "Interactive regex tutorial. Learn by doing.", url: "https://regexlearn.com" },
      { sub: "Reference", name: "Roadmap.sh", description: "Visual, community-driven roadmaps for every developer role.", url: "https://roadmap.sh" },
      // Tools
      { sub: "Tools", name: "ExplainShell", description: "Paste any shell command to get a breakdown of each part.", url: "https://explainshell.com" },
      { sub: "Tools", name: "JSON Crack", description: "Visualize JSON, YAML, CSV, and XML as interactive graphs.", url: "https://jsoncrack.com" },
      { sub: "Tools", name: "RegEx101", description: "Build, test, and debug regular expressions with explanation.", url: "https://regex101.com" },
      { sub: "Tools", name: "cURL Converter", description: "Convert curl commands to code in any language.", url: "https://curlconverter.com" },
      { sub: "Tools", name: "TablePlus", description: "Modern DB GUI for Postgres, MySQL, SQLite, Redis, and more.", url: "https://tableplus.com" },
      // Learning
      { sub: "Learning", name: "freeCodeCamp", description: "Full coding curriculum. Certifications included. Free forever.", url: "https://www.freecodecamp.org" },
      { sub: "Learning", name: "The Odin Project", description: "Open-source full-stack web dev curriculum.", url: "https://www.theodinproject.com" },
      { sub: "Learning", name: "CS50", description: "Harvard's intro to CS. The best starting point.", url: "https://cs50.harvard.edu" },
      { sub: "Learning", name: "fast.ai", description: "Practical deep learning for coders. Free notebooks.", url: "https://course.fast.ai" },
      { sub: "Learning", name: "SQLZoo", description: "Interactive SQL tutorial. Learn by querying real data.", url: "https://sqlzoo.net" },
      { sub: "Learning", name: "Flexbox Froggy", description: "Learn CSS Flexbox by guiding a frog to its lily pad.", url: "https://flexboxfroggy.com" },
      { sub: "Learning", name: "CSS Grid Garden", description: "Learn CSS Grid by growing a garden.", url: "https://cssgridgarden.com" },
    ],
  },
];

export default function LibraryPage() {
  const [activeId, setActiveId] = useState(LIBRARY[0].id);
  const active = LIBRARY.find((s) => s.id === activeId)!;

  // Group resources by subsection
  const grouped = active.resources.reduce<Record<string, Resource[]>>((acc, r) => {
    const key = r.sub ?? "General";
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div className="min-h-screen text-[#e4e4e7] flex flex-col">

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-[#0d0d0d]/98 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center gap-4">
          <Link href="/" className="shrink-0">
            <img src="/logo.png" alt="EEAAO" className="h-7 w-7 rounded-sm object-cover" />
          </Link>
          <div className="w-px h-4 bg-[#2a2a2a] shrink-0" />
          <span className="text-[10px] font-mono text-[#71717a] tracking-widest">/library</span>
          <div className="flex-1" />
          <Link href="/" className="text-[10px] font-mono text-[#71717a] hover:text-[#a1a1aa] transition-colors tracking-widest">
            ← back
          </Link>
        </div>
      </nav>

      <div className="flex flex-col md:flex-row flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 gap-6">

        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-52 shrink-0 gap-0.5">
          <p className="text-[9px] font-mono text-[#3f3f46] tracking-widest mb-3 px-1">CATEGORIES</p>
          {LIBRARY.map((section) => {
            const isActive = section.id === activeId;
            return (
              <button
                key={section.id}
                onClick={() => setActiveId(section.id)}
                className="flex items-center gap-2.5 px-3 py-2 rounded text-left transition-all duration-150 w-full"
                style={{
                  backgroundColor: isActive ? `${section.accent}12` : "transparent",
                  borderLeft: isActive ? `2px solid ${section.accent}` : "2px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "#ffffff08";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }}
              >
                <span className="text-xs shrink-0" style={{ color: isActive ? section.accent : "#52525b" }}>
                  {section.icon}
                </span>
                <span className="text-[11px] font-mono truncate" style={{ color: isActive ? section.accent : "#71717a" }}>
                  {section.label}
                </span>
                <span className="ml-auto text-[9px] font-mono text-[#3f3f46] shrink-0">
                  {section.resources.length}
                </span>
              </button>
            );
          })}

          <div className="mt-auto pt-6 px-1">
            <p className="text-[9px] font-mono text-[#2a2a2a] leading-relaxed">
              Links sourced from{" "}
              <a href="https://fmhy.net" target="_blank" rel="noopener noreferrer"
                className="text-[#3f3f46] hover:text-[#52525b] underline underline-offset-2 transition-colors">
                FMHY.net
              </a>
            </p>
          </div>
        </aside>

        {/* Mobile tab strip */}
        <div className="md:hidden w-full mb-4">
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {LIBRARY.map((section) => {
              const isActive = section.id === activeId;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveId(section.id)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono border transition-all"
                  style={{
                    borderColor: isActive ? section.accent : "#2a2a2a",
                    color: isActive ? section.accent : "#52525b",
                    backgroundColor: isActive ? `${section.accent}10` : "transparent",
                  }}
                >
                  {section.icon} {section.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xl" style={{ color: active.accent }}>{active.icon}</span>
            <div>
              <h1 className="text-base font-bold tracking-tight" style={{ color: active.accent }}>
                {active.label}
              </h1>
              <p className="text-[10px] font-mono text-[#3f3f46]">{active.resources.length} resources</p>
            </div>
          </div>

          {/* Subsections as compact lists */}
          <div className="space-y-6">
            {Object.entries(grouped).map(([sub, items]) => (
              <div key={sub}>
                {/* Subsection divider */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[9px] font-mono tracking-widest uppercase" style={{ color: `${active.accent}70` }}>
                    {sub}
                  </span>
                  <div className="flex-1 h-px" style={{ backgroundColor: `${active.accent}15` }} />
                </div>

                {/* List rows */}
                <div className="space-y-0">
                  {items.map((r) => (
                    <a
                      key={r.url}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3 px-3 py-2.5 rounded transition-all duration-100 -mx-3"
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = `${active.accent}08`;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      }}
                    >
                      <span
                        className="text-[9px] font-mono shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                        style={{ color: active.accent }}
                      >↗</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
                          <span className="text-[11px] font-semibold text-[#d4d4d8] group-hover:text-white transition-colors shrink-0">
                            {r.name}
                          </span>
                          <span className="text-[10px] text-[#52525b] group-hover:text-[#71717a] transition-colors leading-relaxed min-w-0 sm:truncate">
                            {r.description}
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="md:hidden text-[9px] font-mono text-[#2a2a2a] mt-8">
            Links sourced from{" "}
            <a href="https://fmhy.net" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              FMHY.net
            </a>
          </p>
        </main>
      </div>
    </div>
  );
}
