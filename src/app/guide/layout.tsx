import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VICOBA Guide | Akiba, Mikopo & Mikutano",
  description:
    "Learn how VICOBA Community Hub supports village savings groups with contributions, loans, members, wallet records, and meetings. Jifunze kusimamia kikundi chako cha VICOBA.",
  alternates: { canonical: "/guide" },
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}