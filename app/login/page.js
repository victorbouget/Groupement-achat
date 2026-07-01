'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [mode, setMode] = useState('login') // 'login' ou 'signup'
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage('Email ou mot de passe incorrect')
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  const handleSignup = async () => {
    if (!email || !password) {
      setMessage('Remplis tous les champs !')
      return
    }
    if (password.length < 6) {
      setMessage('Le mot de passe doit faire au moins 6 caractères')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setMessage('Erreur : ' + error.message)
    } else {
      setMessage('Inscription reussie ! Verifie ton email pour confirmer ton compte 📧')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: '#15803d' }}>
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 text-center">
          <div className="text-6xl mb-4">🌾</div>
          <h1 className="text-3xl font-bold text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>Groupement de l'Ille</h1>
          <p className="text-white/80 mt-2">Plateforme de commandes groupees</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8">

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setMessage('') }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${mode === 'login' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-400'}`}
            >
              Se connecter
            </button>
            <button
              onClick={() => { setMode('signup'); setMessage('') }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${mode === 'signup' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-400'}`}
            >
              S'inscrire
            </button>
          </div>

          {/* Formulaire */}
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Email</label>
              <input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-green-400 bg-gray-50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-green-400 bg-gray-50"
              />
            </div>

            {message && (
              <div className={`rounded-xl px-4 py-3 text-sm ${message.includes('reussie') || message.includes('📧') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {message}
              </div>
            )}

            <button
              onClick={mode === 'login' ? handleLogin : handleSignup}
              disabled={loading}
              className="w-full bg-green-700 text-white py-3 rounded-xl font-semibold hover:bg-green-800 disabled:opacity-50 mt-2"
            >
              {loading ? '...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
            </button>
          </div>
        </div>

        {/* Lien qui sommes nous */}
        <Link href="/qui-sommes-nous">
          <button className="mt-6 bg-white text-green-700 px-5 py-2 rounded-xl text-sm font-semibold">
            Qui sommes-nous ?
          </button>
        </Link>
      </div>
    </main>
  )
}
