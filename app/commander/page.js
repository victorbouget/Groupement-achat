'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Commander() {
  const [campagnes, setCampagnes] = useState([])
  const [campagneSelectionnee, setCampagneSelectionnee] = useState(null)
  const [produits, setProduits] = useState([])
  const [quantites, setQuantites] = useState({})
  const [dejaCommande, setDejaCommande] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data } = await supabase
        .from('campagnes')
        .select('*')
        .eq('statut', 'ouverte')
        .order('date_debut', { ascending: false })
      setCampagnes(data || [])
    }
    init()
  }, [])

  const selectionnerCampagne = async (campagne) => {
    setCampagneSelectionnee(campagne)
    setQuantites({})
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()

    // Verifier si l'adherent a deja commande
    const { data: commandeExistante } = await supabase
      .from('commandes')
      .select('id')
      .eq('user_id', user.id)
      .eq('campagne_id', campagne.id)
      .single()

    setDejaCommande(!!commandeExistante)

    // Charger les produits de la campagne
    const { data: produitsData } = await supabase
      .from('campagne_produits')
      .select('*, produits(nom)')
      .eq('campagne_id', campagne.id)

    setProduits(produitsData || [])
  }

  const handleCommander = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const lignes = Object.entries(quantites)
      .filter(([_, q]) => q > 0)
      .map(([campagne_produit_id, quantite]) => ({
        campagne_produit_id: parseInt(campagne_produit_id),
        quantite: parseFloat(quantite)
      }))

    if (lignes.length === 0) {
      setMessage('Ajoute au moins un produit !')
      setLoading(false)
      return
    }

    // Creer la commande
    const { data: commande, error } = await supabase
      .from('commandes')
      .insert({ user_id: user.id, campagne_id: campagneSelectionnee.id, statut: 'en cours' })
      .select()
      .single()

    if (error) {
      setMessage('Erreur : ' + error.message)
      setLoading(false)
      return
    }

    // Ajouter les produits
    const commandeProduits = lignes.map((l) => ({
      commande_id: commande.id,
      produit_id: produits.find(p => p.id === l.campagne_produit_id)?.produits?.id || l.campagne_produit_id,
      quantite: l.quantite
    }))

    await supabase.from('commande_produits').insert(commandeProduits)
    setMessage('Commande envoyee avec succes !')
    setDejaCommande(true)
    setLoading(false)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  return (
    <main className="min-h-screen bg-green-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-green-800">Passer une commande</h1>
          <Link href="/dashboard">
            <button className="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200">
              Retour
            </button>
          </Link>
        </div>

        {/* Liste des campagnes ouvertes */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Campagnes ouvertes</h2>
          {campagnes.length === 0 ? (
            <p className="text-gray-500">Aucune campagne ouverte pour le moment</p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {campagnes.map((campagne) => (
                <div
                  key={campagne.id}
                  onClick={() => selectionnerCampagne(campagne)}
                  className={`bg-white rounded-xl p-4 border cursor-pointer hover:border-green-400 ${campagneSelectionnee?.id === campagne.id ? 'border-green-500' : 'border-green-100'}`}
                >
                  <p className="font-semibold text-gray-800">{campagne.nom}</p>
                  <p className="text-sm text-gray-400">
                    Jusqu'au {new Date(campagne.date_fin).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Produits de la campagne */}
        {campagneSelectionnee && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
            <h2 className="text-xl font-semibold text-green-700 mb-4">{campagneSelectionnee.nom}</h2>

            {dejaCommande ? (
              <div className="text-center py-8">
                <p className="text-gray-600 text-lg mb-2">Vous avez deja commande sur cette campagne</p>
                <p className="text-gray-400 text-sm">Pour modifier votre commande, contactez-nous</p>
              </div>
            ) : (
              <>
                <table className="w-full text-sm mb-6">
                  <thead>
                    <tr className="text-gray-500 border-b">
                      <th className="text-left pb-2">Produit</th>
                      <th className="text-left pb-2">Conditionnement</th>
                      <th className="text-left pb-2">Description</th>
                      <th className="text-right pb-2">Quantite</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produits.map((cp) => (
                      <tr key={cp.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{cp.produits?.nom}</td>
                        <td className="py-3 text-gray-500">{cp.conditionnement}</td>
                        <td className="py-3 text-gray-400 text-xs">{cp.description}</td>
                        <td className="py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            onChange={(e) => setQuantites({ ...quantites, [cp.id]: e.target.value })}
                            className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-center"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button
                  onClick={handleCommander}
                  disabled={loading}
                  className="w-full bg-green-700 text-white py-3 rounded-xl text-lg hover:bg-green-800 disabled:opacity-50"
                >
                  {loading ? 'Envoi...' : 'Envoyer ma commande'}
                </button>
              </>
            )}

            {message && (
              <p className="mt-4 text-center text-green-700 font-semibold">{message}</p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
