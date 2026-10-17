"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Play, RotateCcw, Disc3 } from "lucide-react";
import { Cormorant_Garamond, Plus_Jakarta_Sans, Syne } from "next/font/google";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const displayBold = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
});

// ---------- ASSETS (semua dari /public) ----------
const asset = (path: string) => encodeURI(path);

const MUSIC_WAVE = asset("/music/wave to earth - peach eyes (Lyrics) [ENG].mp3");
const MUSIC_JAMRUD = asset("/music/Jamrud - Selamat Ulang Tahun (Official Lyric Video).mp3");

const PHOTO_NAMES = [
  "10.42.30", "10.42.30 (1)", "10.42.31", "10.42.32",
  "10.42.40", "10.42.40 (1)", "10.42.40 (2)", "10.42.40 (3)",
  "10.42.41", "10.42.41 (1)",
  "10.42.42", "10.42.42 (1)", "10.42.42 (2)", "10.42.42 (3)",
  "10.42.43", "10.42.43 (1)", "10.42.43 (2)",
  "10.42.44", "10.42.44 (1)", "10.42.44 (2)",
  "10.42.45", "10.42.45 (1)", "10.42.45 (2)",
  "10.42.46", "10.42.46 (1)", "10.42.46 (2)",
  "10.42.47", "10.42.44 (1)",
];
// hilangkan duplikat jaga-jaga
const PHOTOS = Array.from(new Set(PHOTO_NAMES)).map((n) =>
  asset(`/image/WhatsApp Image 2026-10-17 at ${n}.jpeg`)
);
const VIDEO = asset("/image/WhatsApp Video 2026-10-17 at 10.42.39.mp4");

// Semua foto dipakai di kedua fase (urutan dibalik di fase 2) biar tiap slide singkat tapi tetap pas lagu
const WAVE_PHOTOS = PHOTOS;
const JAMRUD_PHOTOS = [...PHOTOS].reverse();
const COLLAGE_PHOTOS = PHOTOS.slice(-6);

// Durasi lagu (detik) – slide dibuat pas dengan lagunya
const WAVE_LENGTH_MS = 185_000;
const JAMRUD_LENGTH_MS = 234_000;
const WAVE_INTRO_MS = 6_000;
const WAVE_PHOTO_MS = Math.floor((WAVE_LENGTH_MS - 2_000 - WAVE_INTRO_MS) / WAVE_PHOTOS.length);
const TRANSITION_MS = 3_500;
const VIDEO_MS = 14_000;
const COLLAGE_MS = 10_000;
const OUTRO_MS = 14_000;
const JAMRUD_PHOTO_MS = Math.floor(
  (JAMRUD_LENGTH_MS - TRANSITION_MS - VIDEO_MS - COLLAGE_MS - OUTRO_MS) / JAMRUD_PHOTOS.length
);

const WAVE_CAPTIONS = [
  "Satu tahun lagi, satu cerita lagi.",
  "Yang kecil-kecil, yang paling kerasa.",
  "Tawa yang nggak dibuat-buat.",
  "Momen biasa jadi luar biasa.",
  "Kita nggak pernah kehabisan bahan cerita.",
  "Pelan-pelan, tapi pasti.",
  "Ada yang datang, ada yang bertahan.",
  "Dan lu salah satu yang bertahan.",
  "Hari-hari yang nggak akan keulang.",
  "Simpan semuanya baik-baik.",
  "Karena semua ini berharga.",
  "Terima kasih udah jadi lu.",
  "Kita masih punya banyak cerita.",
  "Dan sekarang… waktunya naik level.",
];

// [teks atas, teks bawah, stiker] – gaya meme biar konyol & kenangan
const JAMRUD_MEMES: [string, string, string][] = [
  ["PANJANG UMUR!", "WALAU MUKA UDAH NGGAK UMUR", "🎂"],
  ["FOTO INI DIAMBIL", "TANPA IZIN. SORRY KAK 😭", "📸"],
  ["UMUR NAMBAH", "TAPI TINGKAH TETAP BOCAH", "🤡"],
  ["KAKAK GW", "LEGEND (TAPI GALAK)", "👑"],
  ["TRAKTIR DONG", "MUMPUNG ULTAH, KAK!", "🍔"],
  ["ADA YANG BILANG", "LU MASIH 17. BOHONG BANGET", "🧓"],
  ["ANGKAT TANGAN", "YANG PERNAH DIMARAHIN KAKAK", "🙋"],
  ["SIAPA YANG", "NGEHABISIN MAKANAN GW?!", "🍟"],
  ["DIBALIK KAKAK GALAK", "ADA ADEK YANG SAYANG 🥹", "💖"],
  ["EKSPRESI INI", "LEBIH JUJUR DARI MANTAN", "😐"],
  ["NGAKU AJA KAK", "INI FOTO TERBAIK GW", "😎"],
  ["GW SIMPEN", "BUAT BAHAN NGANCAM SUATU HARI", "😈"],
  ["SELAMAT ULTAH", "TRAKTIRANNYA JANGAN LUPA!", "🎉"],
];

type Slide =
  | { id: string; duration: number; type: "intro"; theme: "dark"; phase: 1 }
  | { id: string; duration: number; type: "wave-photo"; theme: "dark"; phase: 1; image: string; caption: string; index: number }
  | { id: string; duration: number; type: "transition"; theme: "dark"; phase: 2 }
  | { id: string; duration: number; type: "kinetic"; theme: "warm" | "dark"; phase: 2; image: string; headline: string; bottom: string; sticker: string; index: number }
  | { id: string; duration: number; type: "video"; theme: "dark"; phase: 2 }
  | { id: string; duration: number; type: "collage"; theme: "warm"; phase: 2 }
  | { id: string; duration: number; type: "outro"; theme: "dark"; phase: 2 };

const SLIDES: Slide[] = [
  { id: "intro", duration: WAVE_INTRO_MS, type: "intro", theme: "dark", phase: 1 },
  ...WAVE_PHOTOS.map(
    (image, i): Slide => ({
      id: `wave-${i}`,
      duration: WAVE_PHOTO_MS,
      type: "wave-photo",
      theme: "dark",
      phase: 1,
      image,
      caption: WAVE_CAPTIONS[i % WAVE_CAPTIONS.length],
      index: i,
    })
  ),
  { id: "transition", duration: TRANSITION_MS, type: "transition", theme: "dark", phase: 2 },
  ...JAMRUD_PHOTOS.map(
    (image, i): Slide => ({
      id: `kin-${i}`,
      duration: JAMRUD_PHOTO_MS,
      type: "kinetic",
      theme: i % 3 === 2 ? "dark" : "warm",
      phase: 2,
      image,
      headline: JAMRUD_MEMES[i % JAMRUD_MEMES.length][0],
      bottom: JAMRUD_MEMES[i % JAMRUD_MEMES.length][1],
      sticker: JAMRUD_MEMES[i % JAMRUD_MEMES.length][2],
      index: i,
    })
  ),
  { id: "video", duration: VIDEO_MS, type: "video", theme: "dark", phase: 2 },
  { id: "collage", duration: COLLAGE_MS, type: "collage", theme: "warm", phase: 2 },
  { id: "outro", duration: OUTRO_MS, type: "outro", theme: "dark", phase: 2 },
];

const smoothEase = [0.22, 1, 0.36, 1] as const;

// Reff Jamrud (detik) – ubah kalau mau mulai dari bagian tertentu
const JAMRUD_START_TIME = 0;

export default function BirthdayJamrudEdition() {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const waveRef = useRef<HTMLAudioElement | null>(null);
  const jamrudRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimers = useRef<ReturnType<typeof setInterval>[]>([]);
  const lastPhase = useRef<1 | 2>(1);

  const slide = SLIDES[currentSlide];
  const isWarm = slide.theme === "warm";
  const isLast = currentSlide === SLIDES.length - 1;

  const fade = useCallback(
    (audio: HTMLAudioElement | null, to: number, ms: number, pauseAtEnd = false) => {
      if (!audio) return;
      const steps = 30;
      const from = audio.volume;
      let i = 0;
      const t = setInterval(() => {
        i++;
        audio.volume = Math.min(1, Math.max(0, from + ((to - from) * i) / steps));
        if (i >= steps) {
          clearInterval(t);
          if (pauseAtEnd) audio.pause();
        }
      }, ms / steps);
      fadeTimers.current.push(t);
    },
    []
  );

  // Auto advance
  useEffect(() => {
    if (!hasStarted || isLast) return;
    const timer = setTimeout(() => setCurrentSlide((p) => p + 1), slide.duration);
    return () => clearTimeout(timer);
  }, [hasStarted, currentSlide, isLast, slide.duration]);

  // Ganti lagu saat masuk fase 2 (wave -> Jamrud) dan sebaliknya saat replay
  useEffect(() => {
    if (!hasStarted) return;
    const phase = slide.phase;
    if (phase === lastPhase.current) return;
    lastPhase.current = phase;
    const wave = waveRef.current;
    const jam = jamrudRef.current;
    if (!wave || !jam) return;
    if (phase === 2) {
      jam.currentTime = JAMRUD_START_TIME;
      jam.volume = 0;
      jam.play().catch(() => {});
      fade(wave, 0, 1800, true);
      fade(jam, 0.9, 1800);
    } else {
      wave.currentTime = 0;
      wave.volume = 0;
      wave.play().catch(() => {});
      fade(jam, 0, 800, true);
      fade(wave, 0.8, 800);
    }
  }, [currentSlide, hasStarted, slide.phase, fade]);

  useEffect(() => {
    const timers = fadeTimers.current;
    return () => timers.forEach(clearInterval);
  }, []);

  const handleStart = () => {
    setHasStarted(true);
    setCurrentSlide(0);
    lastPhase.current = 1;
    const wave = waveRef.current;
    if (wave) {
      wave.currentTime = 0;
      wave.volume = 0;
      wave.loop = false;
      wave.play().catch((e) => console.log("Audio gagal:", e));
      fade(wave, 0.8, 1500);
    }
  };

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide(0);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isMuted;
    if (waveRef.current) waveRef.current.muted = next;
    if (jamrudRef.current) jamrudRef.current.muted = next;
    setIsMuted(next);
  };

  return (
    <main
      className={`${sans.className} relative flex min-h-screen w-full items-center justify-center bg-[#0A0A09] overflow-hidden select-none`}
    >
      <audio ref={waveRef} src={MUSIC_WAVE} preload="auto" />
      <audio ref={jamrudRef} src={MUSIC_JAMRUD} preload="auto" />

      {/* Preload semua gambar biar transisi mulus */}
      <div className="hidden">
        {PHOTOS.map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p} src={p} alt="" />
        ))}
      </div>

      {/* Ambient blurred backdrop desktop */}
      {hasStarted && "image" in slide && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slide.image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 blur-3xl scale-125 hidden sm:block"
        />
      )}

      <motion.div
        animate={{
          backgroundColor: isWarm ? "#F2ECE1" : "#141312",
          color: isWarm ? "#181716" : "#F4F1EA",
        }}
        transition={{ duration: 0.6, ease: smoothEase }}
        className="relative w-full max-w-[420px] h-[100dvh] max-h-[850px] sm:rounded-3xl overflow-hidden shadow-2xl border border-[#2E2D2B] flex flex-col"
      >
        {/* Film grain */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07] z-50 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {!hasStarted ? (
          /* GATE */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-20 flex flex-col items-center justify-center h-full text-center space-y-7 p-7"
          >
            <div
              className="absolute inset-0 -z-10 opacity-40"
              style={{
                background:
                  "radial-gradient(circle at 50% 35%, rgba(212,175,55,0.25), transparent 60%)",
              }}
            />
            <div className="w-32 h-32 rounded-full border border-[#3A3835] flex items-center justify-center bg-[#0d0d0c] shadow-[0_0_60px_rgba(212,175,55,0.15)]">
              <Disc3 size={52} className="text-[#D4AF37] animate-spin" style={{ animationDuration: "6s" }} />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#A39E93] block">
                Special Birthday Mixtape
              </span>
              <h1 className={`${serif.className} text-4xl italic font-normal text-[#F4F1EA]`}>
                Press Play to Begin.
              </h1>
              <p className="text-[11px] text-[#8A857A] tracking-wide">Nyalakan volume 🎧</p>
            </div>
            <button
              onClick={handleStart}
              className="mt-2 flex items-center gap-3 px-7 py-3.5 rounded-full bg-[#F4F1EA] text-[#141413] text-xs tracking-[0.15em] uppercase font-bold hover:scale-105 active:scale-95 transition-transform duration-300 shadow-lg"
            >
              <Play size={14} fill="currentColor" />
              Putar Sekarang
            </button>
          </motion.div>
        ) : (
          <>
            {/* TOP BAR */}
            <div className="absolute top-0 inset-x-0 z-40 p-5 pt-6 space-y-3 bg-gradient-to-b from-black/50 to-transparent text-[#F4F1EA]">
              <div className="flex gap-[2px] w-full">
                {SLIDES.map((s, idx) => (
                  <div key={s.id} className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/25">
                    {idx === currentSlide && (
                      <motion.div
                        key={`bar-${currentSlide}`}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: s.duration / 1000, ease: "linear" }}
                        className="h-full bg-white"
                      />
                    )}
                    {idx < currentSlide && <div className="h-full w-full bg-white" />}
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-white/20 bg-black/30 backdrop-blur-md">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  >
                    <Disc3 size={13} />
                  </motion.div>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={slide.phase}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-[10px] tracking-wider uppercase font-medium opacity-90"
                    >
                      {slide.phase === 1 ? "wave to earth — peach eyes" : "Jamrud — Selamat Ulang Tahun"}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <button onClick={toggleMute} className="p-1.5 opacity-80 hover:opacity-100 transition-opacity">
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>
            </div>

            {/* STAGE */}
            <div className="relative flex-1">
              <AnimatePresence mode="popLayout">
                {/* INTRO */}
                {slide.type === "intro" && (
                  <motion.div
                    key={slide.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 flex flex-col justify-center px-8 space-y-6"
                  >
                    <div
                      className="absolute inset-0 -z-10"
                      style={{
                        background:
                          "radial-gradient(circle at 70% 20%, rgba(212,175,55,0.18), transparent 55%)",
                      }}
                    />
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 0.6, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-[11px] tracking-[0.25em] uppercase"
                    >
                      Track 01 • Special Release
                    </motion.span>
                    <motion.h2
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.9, ease: smoothEase }}
                      className={`${serif.className} text-5xl italic leading-[1.05]`}
                    >
                      Hari ini hari yang kau tunggu.
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.75 }}
                      transition={{ delay: 1.4 }}
                      className="text-sm leading-relaxed max-w-[280px]"
                    >
                      Sebuah rilisan khusus buat ngerayain level baru hidup lu.
                    </motion.p>
                  </motion.div>
                )}

                {/* PHASE 1: WAVE PHOTO (sinematik, Ken Burns) */}
                {slide.type === "wave-photo" && (
                  <motion.div
                    key={slide.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9 }}
                    className="absolute inset-0 overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <motion.img
                      src={slide.image}
                      alt=""
                      initial={{
                        scale: 1.02,
                        x: slide.index % 2 === 0 ? -12 : 12,
                      }}
                      animate={{
                        scale: 1.18,
                        x: slide.index % 2 === 0 ? 12 : -12,
                      }}
                      transition={{ duration: slide.duration / 1000 + 1, ease: "linear" }}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40" />
                    <div className="absolute bottom-0 inset-x-0 p-7 pb-9 space-y-3 text-[#F4F1EA]">
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.7 }}
                        transition={{ delay: 0.3 }}
                        className="text-[10px] tracking-[0.25em] uppercase block"
                      >
                        {String(slide.index + 1).padStart(2, "0")} / {String(WAVE_PHOTOS.length).padStart(2, "0")}
                      </motion.span>
                      <motion.p
                        initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ delay: 0.4, duration: 0.9, ease: smoothEase }}
                        className={`${serif.className} text-3xl italic leading-tight`}
                      >
                        {slide.caption}
                      </motion.p>
                    </div>
                  </motion.div>
                )}

                {/* TRANSITION → JAMRUD */}
                {slide.type === "transition" && (
                  <motion.div
                    key={slide.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 bg-[#0d0d0c]"
                  >
                    <motion.div
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.8, ease: smoothEase }}
                    >
                      <Disc3 size={56} className="text-[#D4AF37] animate-spin" style={{ animationDuration: "1.5s" }} />
                    </motion.div>
                    <motion.h2
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.7, ease: smoothEase }}
                      className={`${displayBold.className} mt-6 text-5xl uppercase leading-[0.95] text-[#F4F1EA]`}
                    >
                      Udah<br />
                      <span className="text-[#D4AF37]">Cukup</span><br />
                      Sedihnya 🤪
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.6 }}
                      transition={{ delay: 1.2 }}
                      className="mt-5 text-[11px] tracking-[0.3em] uppercase"
                    >
                      Track 02 • Jamrud • Selamat Ulang Tahun
                    </motion.p>
                  </motion.div>
                )}

                {/* PHASE 2: KINETIC */}
                {slide.type === "kinetic" && slide.theme === "warm" && (
                  <motion.div
                    key={slide.id}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.5, ease: smoothEase }}
                    className="absolute inset-0 flex flex-col justify-end px-7 pb-8 pt-24 gap-5"
                  >
                    <motion.div
                      initial={{ rotate: slide.index % 2 === 0 ? -10 : 10, y: 80, opacity: 0, scale: 0.7 }}
                      animate={{
                        rotate: slide.index % 2 === 0 ? [-3, 2, -3] : [3, -2, 3],
                        y: 0,
                        opacity: 1,
                        scale: 1,
                      }}
                      transition={{
                        y: { duration: 0.6, ease: smoothEase },
                        opacity: { duration: 0.4 },
                        scale: { duration: 0.6, ease: smoothEase },
                        rotate: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
                      }}
                      className="relative bg-white p-2.5 pb-10 border-2 border-[#181716] shadow-[7px_7px_0px_#181716] flex-1 min-h-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={slide.image} alt="" className="w-full h-full object-cover" />
                      <motion.span
                        initial={{ scale: 0, rotate: -40 }}
                        animate={{ scale: [1, 1.35, 1], rotate: [-15, 15, -15] }}
                        transition={{ scale: { delay: 0.4, duration: 0.8, repeat: Infinity }, rotate: { delay: 0.4, duration: 1.2, repeat: Infinity } }}
                        className="absolute -top-5 -right-3 text-6xl drop-shadow-[3px_3px_0_#181716]"
                      >
                        {slide.sticker}
                      </motion.span>
                      <span className="absolute bottom-2 left-3 text-[11px] font-bold tracking-wider uppercase text-[#181716]/70">
                        #ultahkakak
                      </span>
                    </motion.div>
                    <div className="space-y-2">
                      <span className="inline-block px-2.5 py-0.5 text-[10px] tracking-[0.2em] font-bold uppercase bg-[#181716] text-[#F2ECE1] -rotate-2">
                        Kenangan Kita 📸
                      </span>
                      <motion.h3
                        initial={{ y: 25, opacity: 0, rotate: -3 }}
                        animate={{ y: 0, opacity: 1, rotate: -1 }}
                        transition={{ delay: 0.15, duration: 0.6, ease: smoothEase }}
                        className={`${displayBold.className} text-4xl leading-[0.9] tracking-tight uppercase`}
                      >
                        {slide.headline}
                      </motion.h3>
                      <p className="text-sm font-bold uppercase leading-tight bg-[#D4AF37] inline-block px-2 py-1 rotate-1">
                        {slide.bottom}
                      </p>
                    </div>
                  </motion.div>
                )}

                {slide.type === "kinetic" && slide.theme === "dark" && (
                  <motion.div
                    key={slide.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <motion.img
                      src={slide.image}
                      alt=""
                      initial={{ scale: 1.3 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 3.4, ease: smoothEase }}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                    <motion.h3
                      initial={{ y: -60, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.5, ease: smoothEase }}
                      className={`${displayBold.className} absolute top-24 inset-x-4 text-center text-4xl leading-[0.95] uppercase text-white [text-shadow:-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000,2px_2px_0_#000,0_4px_0_#000]`}
                    >
                      {slide.headline}
                    </motion.h3>
                    <motion.h3
                      initial={{ y: 60, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.5, ease: smoothEase }}
                      className={`${displayBold.className} absolute bottom-10 inset-x-4 text-center text-4xl leading-[0.95] uppercase text-white [text-shadow:-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000,2px_2px_0_#000,0_4px_0_#000]`}
                    >
                      {slide.bottom}
                    </motion.h3>
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.4, 1], rotate: [-20, 20, -20] }}
                      transition={{ delay: 0.5, duration: 1, repeat: Infinity }}
                      className="absolute top-1/2 right-5 text-7xl drop-shadow-[3px_3px_0_#000]"
                    >
                      {slide.sticker}
                    </motion.span>
                  </motion.div>
                )}

                {/* VIDEO */}
                {slide.type === "video" && (
                  <motion.div
                    key={slide.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 bg-black"
                  >
                    <video
                      src={VIDEO}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
                    <motion.p
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.7, ease: smoothEase }}
                      className={`${displayBold.className} absolute bottom-10 left-7 right-7 text-4xl leading-[0.95] uppercase text-[#F4F1EA]`}
                    >
                      Ini aja masih <span className="text-[#D4AF37]">nggak ketahuan 🤣</span>
                    </motion.p>
                  </motion.div>
                )}

                {/* COLLAGE */}
                {slide.type === "collage" && (
                  <motion.div
                    key={slide.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex flex-col justify-end px-5 pb-8 pt-24 gap-4"
                  >
                    <div className="grid grid-cols-3 gap-2 flex-1 min-h-0">
                      {COLLAGE_PHOTOS.slice(0, 6).map((src, i) => (
                        <motion.div
                          key={src}
                          initial={{ opacity: 0, scale: 0.6, rotate: (i % 2 ? 1 : -1) * 8 }}
                          animate={{ opacity: 1, scale: 1, rotate: (i % 2 ? 1 : -1) * 1.5 }}
                          transition={{ delay: i * 0.15, duration: 0.6, ease: smoothEase }}
                          className="overflow-hidden border-2 border-[#181716] shadow-[4px_4px_0px_#181716]"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" className="w-full h-full object-cover" />
                        </motion.div>
                      ))}
                    </div>
                    <motion.h3
                      initial={{ y: 25, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 1, duration: 0.6, ease: smoothEase }}
                      className={`${displayBold.className} text-4xl leading-[0.92] uppercase`}
                    >
                      Bukti<br />kita emang<br />nggak waras 🤪
                    </motion.h3>
                  </motion.div>
                )}

                {/* OUTRO */}
                {slide.type === "outro" && (
                  <motion.div
                    key={slide.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 flex flex-col justify-center px-8 space-y-6"
                  >
                    <div
                      className="absolute inset-0 -z-10"
                      style={{
                        background:
                          "radial-gradient(circle at 30% 80%, rgba(212,175,55,0.2), transparent 55%)",
                      }}
                    />
                    <span className="text-[11px] tracking-[0.25em] opacity-60 uppercase">
                      Selamat Ulang Tahun
                    </span>
                    <h2 className={`${serif.className} text-4xl italic leading-tight`}>
                      Sehat terus, makin sukses, dan traktirannya jangan lupa.
                    </h2>
                    <div className="w-12 h-[1px] bg-current opacity-40" />
                    <p className="text-xs tracking-wider opacity-75">— Dari adek lu, Dimm.</p>
                    <button
                      onClick={handleReplay}
                      className="mt-4 self-start flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase opacity-70 hover:opacity-100 transition-opacity"
                    >
                      <RotateCcw size={13} />
                      Putar Ulang
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </motion.div>
    </main>
  );
}