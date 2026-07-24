"use client";

import React, { useState, useEffect } from "react";

export interface AgendaItem {
  id: string;
  title: string;
  seconds: number;
}

interface AgendaSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadItem: (seconds: number, title: string) => void;
}

export default function AgendaSidebar({
  isOpen,
  onClose,
  onLoadItem,
}: AgendaSidebarProps) {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemHours, setNewItemHours] = useState("");
  const [newItemMinutes, setNewItemMinutes] = useState("");
  const [inputMode, setInputMode] = useState<"duration" | "target">("duration");
  const [targetTime, setTargetTime] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("sut-timer-agenda");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse agenda items", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when items change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("sut-timer-agenda", JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    let totalMinutes = 0;
    if (inputMode === "duration") {
      const hrs = parseInt(newItemHours, 10) || 0;
      const mins = parseInt(newItemMinutes, 10) || 0;
      totalMinutes = hrs * 60 + mins;
    } else {
      if (!targetTime) return;
      const [tHrs, tMins] = targetTime.split(":").map(Number);
      if (isNaN(tHrs) || isNaN(tMins)) return;

      const now = new Date();
      const target = new Date();
      target.setHours(tHrs, tMins, 0, 0);

      // If target is earlier than now, assume it's for tomorrow
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }
      
      totalMinutes = Math.floor((target.getTime() - now.getTime()) / 60000);
    }

    if (totalMinutes <= 0) return;

    const newItem: AgendaItem = {
      id: Date.now().toString(),
      title: newItemTitle.trim(),
      seconds: totalMinutes * 60,
    };

    setItems([...items, newItem]);
    setNewItemTitle("");
    setNewItemHours("");
    setNewItemMinutes("");
    setTargetTime("");
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    let parts = [];
    if (hrs > 0) parts.push(`${hrs} ชม.`);
    if (mins > 0 || (hrs === 0 && secs === 0)) parts.push(`${mins} นาที`);
    if (secs > 0) parts.push(`${secs} วิ`);
    return parts.join(' ');
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full max-w-sm bg-[#120a05] border-l border-white/10 z-[70] flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-gradient flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-accent-gold">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            กำหนดการ (Agenda)
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {items.length === 0 ? (
            <div className="text-center text-white/30 py-10 flex flex-col items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75v-.008z" />
              </svg>
              <p>ยังไม่มีรายการกำหนดการ<br/>เพิ่มคิวด้านล่างได้เลยครับ</p>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between group hover:bg-white/10 transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white mb-1">
                    <span className="text-accent-gold mr-2">{index + 1}.</span>
                    {item.title}
                  </span>
                  <span className="text-xs text-white/50">{formatTime(item.seconds)}</span>
                </div>
                
                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      onLoadItem(item.seconds, item.title);
                      onClose();
                    }}
                    className="p-2 bg-primary-500/20 text-primary-400 hover:bg-primary-500/40 rounded-lg transition-colors"
                    title="ส่งเวลาเข้าหน้าจอหลัก"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L8.029 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-lg transition-colors"
                    title="ลบ"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Form */}
        <div className="p-6 border-t border-white/10 bg-white/5">
          <form onSubmit={handleAddItem} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">หัวข้อ / ชื่อผู้พูด</label>
              <input
                type="text"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                placeholder="เช่น อธิการบดี"
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-gold/50 transition-colors"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-white/50">รูปแบบการตั้งเวลา</label>
                <div className="flex bg-black/40 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setInputMode("duration")}
                    className={`text-xs px-3 py-1 rounded-md transition-colors ${inputMode === "duration" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
                  >
                    ระยะเวลา
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("target")}
                    className={`text-xs px-3 py-1 rounded-md transition-colors ${inputMode === "target" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
                  >
                    ระบุเวลาเลิก
                  </button>
                </div>
              </div>
              
              {inputMode === "duration" ? (
                <>
                  {/* Quick Add Buttons */}
                  <div className="flex flex-wrap gap-2 mb-1">
                    <button type="button" onClick={() => {setNewItemHours("0"); setNewItemMinutes("5");}} className="text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-md text-white/70 transition-colors">5 นาที</button>
                    <button type="button" onClick={() => {setNewItemHours("0"); setNewItemMinutes("10");}} className="text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-md text-white/70 transition-colors">10 นาที</button>
                    <button type="button" onClick={() => {setNewItemHours("0"); setNewItemMinutes("30");}} className="text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-md text-white/70 transition-colors">30 นาที</button>
                    <button type="button" onClick={() => {setNewItemHours("1"); setNewItemMinutes("0");}} className="text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-md text-white/70 transition-colors">1 ชม.</button>
                  </div>

                  <div className="flex gap-2 items-end">
                    <div className="flex-1 flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          min="0"
                          value={newItemHours}
                          onChange={(e) => setNewItemHours(e.target.value)}
                          placeholder="ชม."
                          className="w-full bg-black/50 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-accent-gold/50 transition-colors text-center"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white/30 pointer-events-none">h</span>
                      </div>
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          min="0"
                          value={newItemMinutes}
                          onChange={(e) => setNewItemMinutes(e.target.value)}
                          placeholder="นาที"
                          className="w-full bg-black/50 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-accent-gold/50 transition-colors text-center"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white/30 pointer-events-none">m</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/40">เวลาสิ้นสุด (น.ด. 15:30)</label>
                  <input
                    type="time"
                    value={targetTime}
                    onChange={(e) => setTargetTime(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-gold/50 transition-colors"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={!newItemTitle.trim() || (inputMode === "duration" ? (!newItemHours && !newItemMinutes) : !targetTime)}
                className="mt-2 w-full bg-accent-gold hover:bg-accent-gold/90 disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0502] font-semibold px-4 py-2 rounded-lg text-sm transition-colors h-[38px] flex items-center justify-center shrink-0"
              >
                เพิ่มคิว
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
