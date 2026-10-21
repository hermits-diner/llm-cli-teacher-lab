import type { Metadata } from "next";
import { Gaegu, Geist, Gothic_A1, Noto_Sans_KR } from "next/font/google";
import { toolBootScript } from "@/components/ToolPicker";
import { themeBootScript } from "@/components/ThemePicker";
import { DEFAULT_TOOL } from "@/lib/site";
import "./globals.css";

// Type roles (see the tokens at the top of globals.css):
//   body    Geist for Latin and digits, Noto Sans KR for Hangul
//   label   the body face at a small size; monospace is kept for commands only
//   display Gothic A1 in heavy weights, a plain sans for titles (no serif)
//   pen     Gaegu, a teacher's handwriting, for the few marginal labels
const geist = Geist({ subsets: ["latin"], display: "swap", variable: "--font-geist" });
const noto = Noto_Sans_KR({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap", variable: "--font-noto" });
const gothic = Gothic_A1({ subsets: ["latin"], weight: ["700", "800"], display: "swap", variable: "--font-gothic" });
const gaegu = Gaegu({ subsets: ["latin"], weight: ["700"], display: "swap", variable: "--font-gaegu" });

export const metadata: Metadata = {
  title: { default: "LLM CLI 기반 수업자료제작 및 업무활용", template: "%s | LLM CLI 기반 수업자료제작 및 업무활용" },
  description: "명령창에서 AI에게 일을 시켜 보는 90분 실습. 따라 하면 웹페이지와 가정통신문이 완성됩니다.",
};

// Only the document shell lives here. The cover (app/page.tsx) fills the whole
// screen like a title slide; every other page gets the header, timetable strip
// and footer from app/(site)/layout.tsx.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      data-tool={DEFAULT_TOOL}
      className={`${geist.variable} ${noto.variable} ${gothic.variable} ${gaegu.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: toolBootScript }} />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
