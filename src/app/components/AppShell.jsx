export default function AppShell({ children }) {
  return <div className="app-shell app-shell--white min-h-screen bg-page text-ink"><div className="mx-auto w-full max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8">{children}</div></div>;
}
