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

  const getStatutEmoji = (statut) => {
    if (statut === 'receptionnee') return '✅'
    if (statut === 'livree') return '📦'
    if (statut === 'validee') return '👍'
    return '⏳'
  }

  return (
    <main className="min-h-screen bg-green-50">
      {/* Header */}
      <div className="bg-green-700 text-white px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Mes commandes</h1>
          <Link href="/dashboard">
            <button className="bg-green-800 text-white px-3 py-2 rounded-lg text-sm">
              Retour
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {commandes.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-500">Aucune commande pour le moment</p>
          </div>
        ) : (
          commandes.map((commande) => {
            const nbRecus = commande.commande_produits.filter(cp => cp.recu).length
            const nbTotal = commande.commande_produits.length
            const progression = Math.round((nbRecus / nbTotal) * 100)

            return (
              <div key={commande.id} className="bg-white rounded-2xl shadow-sm mb-4 border border-gray-100 overflow-hidden">
                {/* En-tete commande */}
                <div className="px-4 py-4 border-b border-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-800">
                        {getStatutEmoji(commande.statut)} {commande.campagnes?.nom || 'Commande'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(commande.date_commande).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(commande.statut)}`}>
                      {commande.statut}
                    </span>
                  </div>

                  {/* Barre de progression */}
                  <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Reception : {nbRecus}/{nbTotal}</span>
                        <span>{progression}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${progression}%` }}
                        />
                      </div>
                    </div>
                </div>

                {/* Produits */}
                <div className="px-4 py-2">
                  {commande.commande_produits.map((ligne) => (
                    <div
                      key={ligne.id}
                      className={`flex items-center justify-between py-3 border-b last:border-0 ${ligne.recu ? 'opacity-60' : ''}`}
                    >
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${ligne.recu ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {ligne.produits?.nom}
                        </p>
                        <p className="text-xs text-gray-400">
                          {ligne.quantite} {ligne.produits?.unite}
                        </p>
                      </div>
                      <button
                          onClick={() => toggleRecu(ligne.id, ligne.recu, commande.id)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center ml-3 transition-all ${
                            ligne.recu
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {ligne.recu ? '✓' : '○'}
                        </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </main>
  )
}
