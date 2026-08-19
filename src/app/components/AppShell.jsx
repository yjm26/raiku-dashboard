export default function AppShell({ children }) {
  return <div className="app-shell app-shell--white min-h-screen bg-page text-ink"><div className="mx-auto w-full max-w-[1140px] px-5 py-4 sm:px-6 lg:px-8">{children}</div></div>;
}
