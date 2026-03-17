import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import AuthProvider from "@/components/providers/AuthProvider";
import LayoutProvider from "@/components/providers/LayoutProvider";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <LayoutProvider>
        <div className="flex h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-y-auto w-full max-w-full">
              {children}
            </main>
          </div>
        </div>
      </LayoutProvider>
    </AuthProvider>
  );
}
