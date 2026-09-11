import { ReactNode } from "react";
import { AdminLayoutWrapper } from "./AdminLayoutWrapper";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | NCSS",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
