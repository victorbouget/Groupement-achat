'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function CotisationSucces() {
  const [message, setMessage] = useState('Validation du paiement...')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const validerPaiement = async () => {
      const userId = searchParams.get('user_id')

      if (!userId) {
        setMessage('Erreur : utilisateur non trouve')
        return
      }

      // Mettre a jour la cotisation dans le profil
      const { error } = await supabase
        .from('profils')
        .update({
          cotisation_payee: true,
          cotisation_annee: new Date().getFullYear()
        })
        .eq('user_id', userId)

      if (error) {
        setMessage('Erreur lors de la validation : ' + error.message)
      } else {
        setMessage('success')
        setTimeout(() => router.push('/dashboard'), 3000)
      }
    }
    validerPaiement()
  }, [])

  return (
    <main className="min-h-screen bg-green-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm p-10 text-center max-w-md border border-green-100">
        {message === 'success' ? (
          <>
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-green-800 mb-2">Paiement confirme !</h1>
            <p className="text-gray-500 mb-6">Votre cotisation {new Date().getFullYear()} a bien ete enregistree.</p>
            <p className="text-sm text-gray-400">Redirection vers le tableau de bord...</p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">{message}</p>
          </>
        )}
      </div>
    </main>
  )
}
