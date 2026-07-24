import Timer from "./components/Timer";

export default function Home() {
  return (
    <main
      id="main-content"
      className="relative min-h-screen flex flex-col items-center justify-center py-4 md:py-6 overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Top-right glow */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        {/* Bottom-left glow */}
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-gold/10 rounded-full blur-3xl" />
        {/* Center subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-400/5 rounded-full blur-3xl" />
      </div>

      {/* Timer Content */}
      <div className="relative z-10 w-full">
        <Timer />
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-auto py-2 text-center space-y-1">
        <p className="text-white/30 text-xs tracking-wider">
          พัฒนาโดย สถานส่งเสริมและพัฒนาระบบสารสนเทศเพื่อการจัดการ (สพส.)
        </p>
        <p className="text-white/20 text-[11px] tracking-wide">
          Management Information System Development Unit (MIS)
        </p>
      </footer>
    </main>
  );
}
