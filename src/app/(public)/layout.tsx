import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col flex-1">
      <Navbar />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
      <Footer />
    </div>
  );
}
