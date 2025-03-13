import './globals.css'

export const metadata = {
  title: 'Vector vs Rerank: See the Difference!',
  description: 'Interactive demo comparing vector similarity search with reranking for more accurate results',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
