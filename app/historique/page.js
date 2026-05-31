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
      chargerCommandes(user.id)
    }
    init()
  }, [])

  const chargerCommandes = async (userId) => {
    const { data } = await supabase
      .from('commandes')
      .select(`
        id,
        date_commande,
        statut,
        campagnes (nom),
        commande_produits (
          id,
          quantite,
          recu,
          produits (nom, unite)
        )
      `)
      .eq('user_id', userId)
      .order('date_commande', { ascending: false })

    setCommandes(data || [])
  }

  const toggleRecu = async (commandeProduitId, recu, commandeId) => {
    await supabase
      .from('commande_produits')
      .update({ recu: !recu })
      .eq('id', commandeProduitId)

    const { data: { user } } = await supabase.auth.getUser()
    await chargerCommandes(user.id)

    const commande = commandes.find(c => c.id === commandeId)
    if (commande) {
      const tousRecus = commande.commande_produits
        .map(cp => cp.id === commandeProduitId ? !recu : cp.recu)
        .every(r => r === true)

      if (tousRecus) {
        await supabase.from('commandes').update({ statut: 'receptionnee' }).eq('id', commandeId)
        await chargerCommandes(user.id)
      }
    }
  }

  const getStatutColor = (statut) => {
    if (statut === 'receptionnee') return 'bg-purple-100 text-purple-700'
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
          commandes.map((commande) => {
            const nbRecus = commande.commande_produits.filter(cp => cp.recu).length
            const nbTotal = commande.commande_produits.length

            return (
              <div key={commande.id} className="bg-white rounded-xl shadow-sm p-6 mb-4 border border-green-100">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    {commande.campagnes?.nom && (
                      <p className="text-lg font-bold text-green-700">{commande.campagnes.nom}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatutColor(commande.statut)}`}>
                    {commande.statut}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  {new Date(commande.date_commande).toLocaleDateString('fr-FR')}
                </p>

                <table className="w-full text-sm mb-4">
                  <thead>
                    <tr className="text-gray-500 border-b">
                      <th className="text-left pb-2">Produit</th>
                      <th className="text-center pb-2">Quantite</th>
                      <th className="text-center pb-2">Recu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commande.commande_produits.map((ligne) => (
                      <tr key={ligne.id} className={`border-b last:border-0 ${ligne.recu ? 'bg-green-50' : ''}`}>
                        <td className="py-3">{ligne.produits?.nom}</td>
                        <td className="py-3 text-center">{ligne.quantite} {ligne.produits?.unite}</td>
                        <td className="py-3 text-center">
                          <input
                            type="checkbox"
                            checked={ligne.recu || false}
                            onChange={() => toggleRecu(ligne.id, ligne.recu, commande.id)}
                            className="w-5 h-5 accent-green-700 cursor-pointer"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Reception : {nbRecus}/{nbTotal} produits</span>
                    <span>{Math.round((nbRecus / nbTotal) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${(nbRecus / nbTotal) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </main>
  )
}
