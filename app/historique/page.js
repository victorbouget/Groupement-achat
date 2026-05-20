'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Historique() {
  const [commandes, setCommandes] = useState([])
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data } = await supabase
        .from('commandes')
        .select(`
          id,
          date_commande,
          statut,
          commande_produits (
            quantite,
            produits (nom, unite, prix)
          )
        `)
        .eq('user_id', user.id)
        .order('date_commande', { ascending: false })

      setCommandes(data || [])
    }
    init()
  }, [])

  const getStatutColor = (statut) => {
    if (statut === 'livree') return 'bg-gray-100 text-gray-600'
    if (statut === 'validee') return 'bg-blue-100 text-blue-700'
    return 'bg-green-100 text-green-700'
  }

  return (
    <main className="min-h-screen bg-green-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-green-800">Historique des commandes</h1>
          <Link href="/dashboard">
            <button className="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200">
              Retour
            </button>
          </Link>
        </div>

        {commandes.length === 0 ? (
          <p className="text-gray-500 text-center mt-20">Aucune commande pour instant</p>
        ) : (
          commandes.map((commande) => (
            <div key={commande.id} className="bg-white rounded-xl shadow-sm p-6 mb-4 border border-green-100">
              <div className="flex justify-between items-center mb-4">
                <p className="font-semibold text-gray-700">
                  Commande #{commande.id}
                </p>
                <span className={`px-3 py-1 rounded-full text-sm ${getStatutColor(commande.statut)}`}>
                  {commande.statut}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                {new Date(commande.date_commande).toLocaleDateString('fr-FR')}
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="text-left pb-2">Produit</th>
                    <th className="text-center pb-2">Quantite</th>
                    <th className="text-right pb-2">Prix unitaire</th>
                  </tr>
                </thead>
                <tbody>
                  {commande.commande_produits.map((ligne, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2">{ligne.produits?.nom}</td>
                      <td className="py-2 text-center">{ligne.quantite} {ligne.produits?.unite}</td>
                      <td className="py-2 text-right">{ligne.produits?.prix} euro</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </main>
  )
}
