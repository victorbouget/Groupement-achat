'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Commande() {
  const [produits, setProduits] = useState([])
  const [panier, setPanier] = useState({})
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data } = await supabase.from('produits').select('*')
      setProduits(data || [])
    }
    init()
  }, [])

  const updateQuantite = (id, valeur) => {
    setPanier({ ...panier, [id]: valeur })
  }

  const handleCommander = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    // Créer la commande
    const { data: commande, error } = await supabase
      .from('commandes')
      .insert({ user_id: user.id, statut: 'en cours' })
      .select()
      .single()

    if (error) {
      setMessage('Erreur : ' + error.message)
      return
    }

    // Ajouter les produits de la commande
    const lignes = Object.entries(panier)
      .filter(([_, quantite]) => quantite > 0)
      .map(([produit_id, quantite]) => ({
        commande_id: commande.id,
        produit_id: parseInt(produit_id),
        quantite: parseFloat(quantite)
      }))

    if (lignes.length === 0) {
      setMessage('Ajoute au moins un produit ! 😊')
      return
    }

    await supabase.from('commande_produits').insert(lignes)
    setMessage('Commande envoyée avec succès ! 🎉')
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  return (
    <main className="min-h-screen bg-green-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-green-800 mb-8">🛒 Nouvelle commande</h1>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          {produits.map((produit) => (
            <div key={produit.id} className="flex items-center justify-between py-4 border-b last:border-0">
              <div>
                <p className="font-semibold text-gray-800">{produit.nom}</p>
                <p className="text-sm text-gray-500">{produit.prix}€ / {produit.unite}</p>
              </div>
              <input
                type="number"
                min="0"
                placeholder="Qté"
                onChange={(e) => updateQuantite(produit.id, e.target.value)}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-center"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleCommander}
          className="w-full bg-green-700 text-white py-3 rounded-xl text-lg hover:bg-green-800"
        >
          Envoyer la commande
        </button>

        {message && (
          <p className="mt-4 text-center text-green-700 font-semibold">{message}</p>
        )}
      </div>
    </main>
  )
}