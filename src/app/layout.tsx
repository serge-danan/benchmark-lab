import "./globals.css";

export const metadata = {
  title: "Benchmark Explorer",
  description: "Explorez les résultats des benchmarks LLM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
