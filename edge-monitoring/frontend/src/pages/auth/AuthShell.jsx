import GlassPanel from '../../components/ui/GlassPanel';

export default function AuthShell({ children }) {
  return (
    <div className="auth-shell flex min-h-screen w-full flex-col bg-base text-ink">
      <div className="auth-shell-frame relative flex w-full flex-1 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="auth-bg-blur auth-bg-blur-left" />
          <div className="auth-bg-blur auth-bg-blur-right" />
          <div className="auth-bg-glow auth-bg-glow-1" />
          <div className="auth-bg-glow auth-bg-glow-2" />
          <div className="noise-overlay absolute inset-0 opacity-25" />
        </div>

        <div className="relative z-10 flex h-full w-full flex-col lg:flex-row">
          <div className="flex flex-1 items-center justify-center lg:justify-start lg:pl-14">
            <div className="brand-panel mt-10 lg:mt-0">
              <div className="brand-mark">
                <span className="brand-mark-text">eX</span>
              </div>
              <h1 className="brand-wordmark">
                <span className="brand-edge">Edge</span>
                <span className="brand-x">X</span>
              </h1>
              <p className="brand-subtitle">Intelligence for the physical world.</p>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center px-4 pb-8 pt-6 lg:px-8 lg:pb-10 lg:pt-10">
            <GlassPanel strong className="auth-card w-full max-w-[420px] rounded-[24px] p-8 lg:p-8">
              {children}
            </GlassPanel>
          </div>
        </div>
      </div>
    </div>
  );
}