'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage('Erreur : ' + error.message)
    } else {
      router.push('/dashboard')
    }
  }

  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setMessage('Erreur : ' + error.message)
    } else {
      setMessage('Inscription réussie ! Vérifie ton email pour confirmer ton compte 📧')
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-green-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-96">
        <h1 className="text-2xl font-bold text-green-800 mb-6 text-center">
          🌾 Groupement d'Achat
        </h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 mb-2"
        >
          Se connecter
        </button>
        <button
          onClick={handleSignup}
          className="w-full bg-gray-100 text-green-800 py-2 rounded-lg hover:bg-gray-200"
        >
          Créer un compte
        </button>
        {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}
      </div>
    </main>
  )
}
