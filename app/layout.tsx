import type { Metadata } from "next";
import { Gaegu, Gothic_A1, Inter, Noto_Sans_KR } from "next/font/google";
import { toolBootScript } from "@/components/ToolPicker";
import { DEFAULT_TOOL } from "@/lib/site";
import "./globals.css";

// Type roles (see the tokens at the top of globals.css):
//   body    Inter for Latin and digits, Noto Sans KR for Hangul
//   display Gothic A1 in heavy weights, a plain sans for titles (no serif)
//   pen     Gaegu, a teacher's handwriting, for the few marginal labels
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const noto = Noto_Sans_KR({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap", variable: "--font-noto" });
const gothic = Gothic_A1({ subsets: ["latin"], weight: ["700", "800"], display: "swap", variable: "--font-gothic" });
const gaegu = Gaegu({ subsets: ["latin"], weight: ["700"], display: "swap", variable: "--font-gaegu" });

export const metadata: Metadata = {
  title: { default: "교사를 위한 AI 에이전트 코딩", template: "%s | 교사를 위한 AI 에이전트 코딩" },
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
      className={`${inter.variable} ${noto.variable} ${gothic.variable} ${gaegu.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: toolBootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
