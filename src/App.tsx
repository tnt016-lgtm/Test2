import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "motion/react";

import {
  Volume2,
  VolumeX,
  Heart,
  Calendar,
  MapPin,
  Copy,
  MessageSquare,
  ChevronDown,
  Clock,
  Music,
  Check,
} from "lucide-react";
import bgm from "./assets/music.mp3";

// --- Types ---
interface GuestbookEntry {
  id: string;
  site_id: string;
  name: string;
  message: string;
  created_at: string;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// --- Supabase Client ---
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const SITE_ID = typeof window !== "undefined" ? window.location.hostname : "localhost";

// --- Components ---

export default function App() {
  // BGM State
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Guestbook State
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [gbLoading, setGbLoading] = useState(false);
  const [gbSubmitting, setGbSubmitting] = useState(false);
  const [gbError, setGbError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});

  // BGM Auto-play handle
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (audioRef.current && !isPlaying) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          // Auto-play might still be blocked
        });
      }
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };

    window.addEventListener("click", handleFirstInteraction);
    window.addEventListener("touchstart", handleFirstInteraction);

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [isPlaying]);

  const toggleBgm = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Guestbook Logic
  const fetchEntries = async () => {
    if (!supabase) return;
    setGbLoading(true);
    setGbError(null);
    try {
      const { data, error } = await supabase
        .from("guestbook")
        .select("*")
        .eq("site_id", SITE_ID)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setEntries(data || []);
    } catch (err: any) {
      setGbError(err.message || "방명록을 불러오는데 실패했습니다.");
    } finally {
      setGbLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || gbSubmitting) return;
    if (!name.trim() || !message.trim()) {
      alert("성함과 메시지를 입력해주세요.");
      return;
    }

    setGbSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("guestbook")
        .insert([{ site_id: SITE_ID, name, message }])
        .select();

      if (error) throw error;
      
      if (data) {
        setEntries((prev) => [data[0], ...prev]);
        setName("");
        setMessage("");
      }
    } catch (err: any) {
      alert(err.message || "메시지 전송에 실패했습니다.");
    } finally {
      setGbSubmitting(false);
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchEntries();
    }
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus({ ...copyStatus, [id]: true });
      setTimeout(() => {
        setCopyStatus({ ...copyStatus, [id]: false });
      }, 2000);
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#4A4A4A] font-sans selection:bg-[#E6D5B8]">
      {/* Background Audio */}
      <audio ref={audioRef} src={bgm} loop />

      {/* BGM Toggle Button */}
      <button
        onClick={toggleBgm}
        className="fixed bottom-6 right-6 z-50 p-3 bg-white/80 backdrop-blur-sm border border-[#E6D5B8] rounded-full shadow-lg text-[#C5A059] hover:scale-110 transition-transform active:scale-95"
      >
        {isPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
      </button>

      <div className="max-w-[420px] mx-auto bg-white shadow-2xl min-h-screen relative overflow-hidden">
        
        {/* 1. Opening Cover */}
        <section className="h-screen flex flex-col items-center justify-center text-center px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="space-y-6"
          >
            <div className="text-[#C5A059] tracking-[0.3em] text-sm font-light uppercase">
              Wedding Invitation
            </div>
            <h1 className="text-4xl font-serif font-light tracking-widest text-[#2D2D2D]">
              김철수 <span className="text-xl mx-2 text-[#C5A059]">&</span> 이영희
            </h1>
            <div className="w-px h-12 bg-[#E6D5B8] mx-auto my-8" />
            <div className="space-y-2">
              <p className="text-lg tracking-widest">2026. 05. 23. SAT. PM 1:00</p>
              <p className="text-sm text-[#8E8E8E] font-light">
                그랜드 하얏트 서울, 그랜드 볼룸
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059]">Scroll Down</span>
            <ChevronDown size={16} className="text-[#C5A059] animate-bounce" />
          </motion.div>
        </section>

        {/* 2. Our Story Timeline */}
        <section className="py-24 px-8 bg-[#F9F7F2]">
          <div className="text-center mb-16">
            <Heart size={24} className="mx-auto text-[#C5A059] mb-4" />
            <h2 className="text-2xl font-serif text-[#2D2D2D] tracking-widest">우리의 이야기</h2>
          </div>
          
          <div className="space-y-12 relative before:absolute before:left-4 before:top-0 before:bottom-0 before:w-px before:bg-[#E6D5B8]">
            {[
              { date: "2022. 03. 15", title: "첫 만남", desc: "벚꽃이 흩날리던 어느 봄날, 우리는 처음 만났습니다." },
              { date: "2024. 12. 24", title: "프러포즈", desc: "가장 추웠던 겨울, 가장 따뜻한 약속을 나누었습니다." },
              { date: "2026. 05. 23", title: "결혼", desc: "이제 평생을 함께할 동반자로 새로운 시작을 합니다." },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="pl-10 relative"
              >
                <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-[#C5A059]" />
                <span className="text-xs text-[#C5A059] font-medium tracking-wider">{item.date}</span>
                <h3 className="text-lg font-serif mt-1 text-[#2D2D2D]">{item.title}</h3>
                <p className="text-sm text-[#8E8E8E] mt-2 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 3. Gallery */}
        <section className="py-24 px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-serif text-[#2D2D2D] tracking-widest">갤러리</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="aspect-[3/4] bg-[#F5F5F5] overflow-hidden rounded-sm"
              >
                <img
                  src={`https://picsum.photos/seed/wedding${i}/600/800`}
                  alt={`Gallery ${i}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            ))}
          </div>
        </section>

        {/* 4. Wedding Info */}
        <section className="py-24 px-8 bg-[#F9F7F2]">
          <div className="text-center mb-12">
            <Calendar size={24} className="mx-auto text-[#C5A059] mb-4" />
            <h2 className="text-2xl font-serif text-[#2D2D2D] tracking-widest">예식 안내</h2>
          </div>
          
          <div className="space-y-8 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2 text-[#C5A059]">
                <Clock size={16} />
                <span className="text-sm font-medium uppercase tracking-widest">When</span>
              </div>
              <p className="text-lg">2026년 5월 23일 토요일</p>
              <p className="text-lg">오후 1시</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2 text-[#C5A059]">
                <MapPin size={16} />
                <span className="text-sm font-medium uppercase tracking-widest">Where</span>
              </div>
              <p className="text-lg">그랜드 하얏트 서울, 그랜드 볼룸</p>
              <p className="text-sm text-[#8E8E8E]">서울특별시 용산구 소월로 322</p>
            </div>

            {/* Map Placeholder */}
            <div className="aspect-video bg-[#E6E6E6] rounded-lg flex items-center justify-center text-[#8E8E8E] text-sm border border-[#D1D1D1]">
              지도 영역 (Kakao/Naver Map API)
            </div>
          </div>
        </section>

        {/* 5. Account Info */}
        <section className="py-24 px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-serif text-[#2D2D2D] tracking-widest">마음 전하실 곳</h2>
            <p className="text-xs text-[#8E8E8E] mt-4 leading-relaxed">
              축복의 마음을 담아 보내주시는 정성은<br />저희의 새로운 출발에 큰 힘이 됩니다.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { label: "신랑측 계좌", bank: "신한은행", account: "110-123-456789", name: "김철수" },
              { label: "신부측 계좌", bank: "국민은행", account: "123456-01-123456", name: "이영희" },
            ].map((acc, idx) => (
              <div key={idx} className="p-5 border border-[#E6D5B8] rounded-xl bg-white space-y-3">
                <div className="text-xs font-semibold text-[#C5A059] uppercase tracking-wider">{acc.label}</div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">{acc.bank}</span> {acc.account}
                    <div className="text-xs text-[#8E8E8E] mt-1">예금주: {acc.name}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(acc.account, `acc-${idx}`)}
                    className="p-2 text-[#C5A059] hover:bg-[#FDFCF8] rounded-full transition-colors"
                  >
                    {copyStatus[`acc-${idx}`] ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Guestbook */}
        <section className="py-24 px-8 bg-[#F9F7F2]">
          <div className="text-center mb-12">
            <MessageSquare size={24} className="mx-auto text-[#C5A059] mb-4" />
            <h2 className="text-2xl font-serif text-[#2D2D2D] tracking-widest">방명록</h2>
          </div>

          {!isSupabaseConfigured ? (
            <div className="p-8 border-2 border-dashed border-[#E6D5B8] rounded-2xl bg-white text-center space-y-4">
              <div className="w-12 h-12 bg-[#FDFCF8] rounded-full flex items-center justify-center mx-auto">
                <Music size={20} className="text-[#C5A059]" />
              </div>
              <h3 className="font-semibold text-[#2D2D2D]">Supabase 설정이 필요합니다</h3>
              <p className="text-xs text-[#8E8E8E] leading-relaxed">
                방명록 기능을 사용하려면 Netlify 환경변수(Secrets)에<br />
                <code className="bg-[#F5F5F5] px-1 rounded text-[#C5A059]">VITE_SUPABASE_URL</code>와<br />
                <code className="bg-[#F5F5F5] px-1 rounded text-[#C5A059]">VITE_SUPABASE_ANON_KEY</code>를<br />
                추가해 주세요.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="성함"
                  maxLength={20}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-4 bg-white border border-[#E6D5B8] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#C5A059] transition-shadow"
                />
                <textarea
                  placeholder="축하의 메시지를 남겨주세요"
                  maxLength={300}
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-4 bg-white border border-[#E6D5B8] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#C5A059] transition-shadow resize-none"
                />
                <button
                  type="submit"
                  disabled={gbSubmitting}
                  className="w-full py-4 bg-[#C5A059] text-white rounded-xl text-sm font-medium hover:bg-[#B48F48] transition-colors disabled:opacity-50"
                >
                  {gbSubmitting ? "전송 중..." : "메시지 남기기"}
                </button>
              </form>

              {/* List */}
              <div className="space-y-4">
                {gbLoading ? (
                  <div className="text-center py-8 text-sm text-[#8E8E8E]">불러오는 중...</div>
                ) : entries.length === 0 ? (
                  <div className="text-center py-8 text-sm text-[#8E8E8E]">첫 번째 축하 메시지를 남겨주세요.</div>
                ) : (
                  entries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 bg-white rounded-xl border border-[#E6D5B8]/50 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-[#2D2D2D]">{entry.name}</span>
                        <span className="text-[10px] text-[#8E8E8E]">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-[#4A4A4A] leading-relaxed whitespace-pre-wrap">
                        {entry.message}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        {/* 7. Ending Message */}
        <section className="py-32 px-8 text-center bg-white">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="w-12 h-px bg-[#E6D5B8] mx-auto" />
            <p className="text-lg font-serif leading-loose text-[#2D2D2D]">
              저희의 시작을 축복해 주시는<br />
              모든 분들의 따뜻한 마음을 잊지 않고<br />
              예쁘게 잘 살겠습니다.
            </p>
            <div className="space-y-2 pt-8">
              <p className="text-sm text-[#8E8E8E] font-light">감사합니다.</p>
              <p className="text-lg font-serif">김철수 · 이영희 드림</p>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-8 text-center text-[10px] text-[#D1D1D1] uppercase tracking-widest bg-[#FDFCF8]">
          © 2026 Chulsoo & Younghee. All Rights Reserved.
        </footer>
      </div>
    </div>
  );
}
