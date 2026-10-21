import type { Metadata } from "next";
import { IBM_Plex_Sans_KR } from "next/font/google";
import { toolBootScript } from "@/components/ToolPicker";
import { DEFAULT_TOOL } from "@/lib/site";
import "./globals.css";

const plex = IBM_Plex_Sans_KR({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex",
});

export const metadata: Metadata = {
  title: { default: "LLM CLI 교사 연수", template: "%s | LLM CLI 교사 연수" },
  description: "명령창에서 AI에게 일을 시켜 보는 90분 실습. 따라 하면 웹페이지와 가정통신문이 완성됩니다.",
};

// Only the document shell lives here. The cover (app/page.tsx) fills the whole
// screen like a title slide; every other page gets the header, timetable strip
// and footer from app/(site)/layout.tsx.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-tool={DEFAULT_TOOL} className={plex.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: toolBootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
