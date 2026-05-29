'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Cotisation() {
  const [montant, setMontant] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Verifier si deja paye cette annee
      const { data: profil } = await supabase
        .from('profils')
        .select('cotisation_payee, cotisation_annee')
        .eq('user_id', user.id)
        .single()

      if (profil?.cotisation_payee && profil?.cotisation_annee === new Date().getFullYear()) {
        router.push('/dashboard')
        return
      }

      // Charger le montant depuis les parametres
      const { data: params } = await supabase
        .from('parametres')
        .select('cotisation_montant')
        .single()

      setMontant(params?.cotisation_montant || 50)
    }
    init()
  }, [])

  const handlePayer = async () => {
    setLoading(true)
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()

    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        montant,
        userId: user.id,
        email: user.email
      })
    })

    const data = await response.json()

    if (data.url) {
      window.location.href = data.url
    } else {
      setMessage('Erreur : ' + data.error)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-green-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm p-10 text-center max-w-md border border-green-100">
        <div className="text-5xl mb-4">🌾</div>
        <h1 className="text-2xl font-bold text-green-800 mb-2">Cotisation annuelle</h1>
        <p className="text-gray-500 mb-6">
          Pour acceder au groupement d'achat, veuillez regler votre cotisation {new Date().getFullYear()}.
        </p>

        {montant && (
          <div className="bg-green-50 rounded-xl p-6 mb-6 border border-green-200">
            <p className="text-4xl font-bold text-green-700">{montant} €</p>
            <p className="text-sm text-gray-400 mt-1">Cotisation {new Date().getFullYear()}</p>
          </div>
        )}

        <button
          onClick={handlePayer}
          disabled={loading}
          className="w-full bg-green-700 text-white py-3 rounded-lg text-lg hover:bg-green-800 disabled:opacity-50"
        >
          {loading ? 'Redirection...' : 'Payer ma cotisation'}
        </button>

        {message && <p className="mt-4 text-red-500 text-sm">{message}</p>}

        <p className="mt-4 text-xs text-gray-400">Paiement securise par Stripe 🔒</p>
      </div>
    </main>
  )
}
