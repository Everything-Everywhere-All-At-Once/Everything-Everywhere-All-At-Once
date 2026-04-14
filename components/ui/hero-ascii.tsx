export default function HeroAscii() {
  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: '88vh' }}>

      {/* Corner marks */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/10 z-20" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/10 z-20" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-white/10 z-20" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/10 z-20" />

      {/* Content */}
      <div className="relative z-10 flex min-h-[88vh] items-center">
        <div className="container mx-auto px-6 lg:px-16 lg:ml-[6%]">
          <div className="max-w-xl">

            {/* Main title */}
            <h1 className="font-black leading-none mb-8 flex flex-col gap-1"
              style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', letterSpacing: '-0.03em' }}>
              <span style={{ color: '#FF2D87' }}>EVERYTHING</span>
              <span style={{ color: '#00E5FF' }}>EVERYWHERE</span>
              <span style={{ color: '#FFD60A' }}>ALL AT ONCE</span>
            </h1>

            {/* Tagline */}
            <p className="text-white/35 mb-10 font-mono tracking-widest"
              style={{ fontSize: 'clamp(0.65rem, 1.2vw, 0.8rem)' }}>
              every tool. one place. nothing leaves your browser.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className="relative px-7 py-3 font-mono text-xs tracking-widest border transition-all duration-200"
                style={{ borderColor: '#FF2D87', color: '#FF2D87', backgroundColor: 'rgba(255,45,135,0.06)' }}
                onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,45,135,0.14)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,45,135,0.06)'}
              >
                <span className="absolute -top-px -left-px w-2 h-2 border-t border-l border-[#FF2D87] opacity-60" />
                <span className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-[#FF2D87] opacity-60" />
                EXPLORE TOOLS
              </button>

              <button
                className="px-7 py-3 font-mono text-xs tracking-widest border transition-all duration-200"
                style={{ borderColor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.35)' }}
                onClick={() => window.location.assign('/library')}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#C055FF';
                  (e.currentTarget as HTMLElement).style.color = '#C055FF';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)';
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)';
                }}
              >
                FREE LIBRARY
              </button>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
