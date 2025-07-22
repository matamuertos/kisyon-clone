'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { auth } from '@/firebase/firebaseConfig'
import { signOut } from 'firebase/auth'
import { useEffect, useState } from 'react'

export default function Header() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((usuario) => {
      setUser(usuario)
    })
    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/login')
  }

  return (
    <header className="bg-black text-white p-4 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <img src="/logo.png" alt="Logo" className="h-8" />
        <h1 className="text-xl font-bold">
          <Link href="/">Mi Web de Aportes</Link>
        </h1>
      </div>
      <nav className="space-x-4">
        <Link href="/enviar" className="hover:underline">Enviar</Link>
        <Link href="/admin" className="hover:underline">Admin</Link>
        {user ? (
          <button onClick={handleLogout} className="ml-4 underline">Salir</button>
        ) : (
          <Link href="/login" className="hover:underline">Login</Link>
        )}
      </nav>
    </header>
  )
}
