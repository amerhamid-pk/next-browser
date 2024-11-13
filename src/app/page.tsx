// src/app/page.tsx
import BrowserInterface from '@/components/BrowserInterface'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between ">
      <BrowserInterface />
    </main>
  )
}