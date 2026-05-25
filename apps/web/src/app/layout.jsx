import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata = {
  title: 'Flex — Live Experience',
  description: 'Tu noche, tu ritmo',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  )
}