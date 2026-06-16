import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} font-sans min-h-screen bg-background text-foreground scroll-smooth flex flex-col`}>
      {children}
    </div>
  );
}
