import Header from "./Header";
import Breadcrumb from "./Breadcrumb";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--app-background)] text-[var(--text-primary)]">
      <Header />
      <main className="mx-auto w-full max-w-[1680px] px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div className="mb-4"><Breadcrumb /></div>
        {children}
      </main>
    </div>
  );
}
