// Raiku's page frame: hairline rails with crosshair marks at the top corners (large screens).
const Cross = ({ className }) => <svg className={`pointer-events-none absolute hidden h-[17px] w-[17px] text-[var(--tick)] lg:block ${className}`} viewBox="0 0 17 17" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5" /><path d="M8.5 0v17M0 8.5h17" /></svg>;

export default function AppShell({ children }) {
  return <div className="app-shell app-shell--white min-h-screen bg-page text-ink lg:pt-6">
    <div className="relative mx-auto w-full max-w-[1392px] lg:w-[calc(100%-48px)] lg:border-x lg:border-t lg:border-rule">
      <Cross className="-left-[8px] -top-[8px]" /><Cross className="-right-[8px] -top-[8px]" />
      <div className="px-4 sm:px-6 lg:px-14">{children}</div>
    </div>
  </div>;
}
