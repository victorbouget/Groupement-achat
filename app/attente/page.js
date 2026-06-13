'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Attente() {
  const router = useRouter()

  useEffect(() => {
    // Verifier si l'utilisateur est maintenant valide
    const verifier = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data: profil } = await supabase
        .from('profils')
        .select('valide')
        .eq('user_id', user.id)
        .single()

      if (profil?.valide) {
        router.push('/dashboard')
      }
    }

    verifier()
    // Verifier toutes les 30 secondes
    const interval = setInterval(verifier, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <main className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center border border-green-100">
        <div className="text-6xl mb-6">⏳</div>
        <h1 className="text-2xl font-bold text-green-800 mb-3">
          Compte en attente de validation
        </h1>
        <p className="text-gray-500 mb-6 leading-relaxed">
          Votre compte a bien ete cree. Un administrateur doit valider votre inscription avant que vous puissiez acceder a la plateforme.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Vous serez automatiquement redirige une fois votre compte valide.
        </p>
        <button
          onClick={handleLogout}
          className="bg-gray-100 text-gray-600 px-6 py-2 rounded-lg hover:bg-gray-200 text-sm"
        >
          Se deconnecter
        </button>
      </div>
    </main>
  )
}
