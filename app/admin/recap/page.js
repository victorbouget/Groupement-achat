'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminRecap() {
  const [campagnes, setCampagnes] = useState([])
  const [campagneSelectionnee, setCampagneSelectionnee] = useState(null)
  const [tableau, setTableau] = useState([])
  const [colonnes, setColonnes] = useState([])
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data } = await supabase.from('campagnes').select('*').order('date_debut', { ascending: false })
      setCampagnes(data || [])
    }
    init()
  }, [])

  const chargerRecap = async (campagne) => {
    setCampagneSelectionnee(campagne)

    // Charger les produits de la campagne
    const { data: campagneProduits } = await supabase
      .from('campagne_produits')
      .select('*, produits(nom)')
      .eq('campagne_id', campagne.id)

    setColonnes(campagneProduits || [])

    // Charger toutes les commandes de la campagne
    const { data: commandes } = await supabase
      .from('commandes')
      .select('id, user_id, commande_produits(quantite, produit_id)')
      .eq('campagne_id', campagne.id)

    if (!commandes || commandes.length === 0) {
      setTableau([])
      return
    }

    // Charger tous les profils correspondants
    const userIds = commandes.map(c => c.user_id)
    const { data: profils } = await supabase
      .from('profils')
      .select('*, depots(nom)')
      .in('user_id', userIds)

    // Construire le tableau
    const lignes = commandes.map((commande) => {
      const profil = profils?.find(p => p.user_id === commande.user_id)
      const ligne = {
        nom: profil?.nom || '',
        prenom: profil?.prenom || '',
        societe: profil?.societe || '',
        telephone: profil?.telephone || '',
        commune: profil?.commune || '',
        code_postal: profil?.code_postal || '',
        depot: profil?.depots?.nom || '',
      }

      // Ajouter les quantites par produit
      campagneProduits.forEach((cp) => {
        const commandeProduit = commande.commande_produits.find(
          (p) => p.produit_id === cp.produit_id
        )
        ligne[`produit_${cp.id}`] = commandeProduit?.quantite || 0
      })

      return ligne
    })

    setTableau(lignes)
  }

  const exporterExcel = () => {
    if (tableau.length === 0) return

    const headers = [
      'Nom', 'Prenom', 'Societe', 'Telephone', 'Commune', 'Code postal', 'Depot',
      ...colonnes.map(c => `${c.produits?.nom} (${c.conditionnement})`)
    ]

    const rows = tableau.map(ligne => [
      ligne.nom, ligne.prenom, ligne.societe, ligne.telephone,
      ligne.commune, ligne.code_postal, ligne.depot,
      ...colonnes.map(c => ligne[`produit_${c.id}`] || 0)
    ])

    const totaux = ['', '', '', '', '', '', 'TOTAL',
      ...colonnes.map(c => tableau.reduce((sum, l) => sum + (parseFloat(l[`produit_${c.id}`]) || 0), 0))
    ]

    const csvContent = [headers, ...rows, totaux]
      .map(row => row.join(';'))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recap_${campagneSelectionnee.nom}.csv`
    a.click()
  }

  return (
    <main className="min-h-screen bg-green-50 p-8">
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-green-800">Recapitulatif des commandes</h1>
          <Link href="/admin">
            <button className="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200">
              Retour admin
            </button>
          </Link>
        </div>

        {/* Choix de la campagne */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-green-100">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Choisir une campagne</h2>
          <div className="flex gap-3 flex-wrap">
            {campagnes.map((campagne) => (
              <button
                key={campagne.id}
                onClick={() => chargerRecap(campagne)}
                className={`px-4 py-2 rounded-lg ${campagneSelectionnee?.id === campagne.id ? 'bg-green-700 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
              >
                {campagne.nom}
              </button>
            ))}
          </div>
        </div>

        {/* Tableau recap */}
        {campagneSelectionnee && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-green-700">{campagneSelectionnee.nom}</h2>
              <button
                onClick={exporterExcel}
                className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800"
              >
                Exporter Excel
              </button>
            </div>

            {tableau.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune commande pour cette campagne</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-green-50 text-gray-600">
                      <th className="text-left p-2 border">Nom</th>
                      <th className="text-left p-2 border">Prenom</th>
                      <th className="text-left p-2 border">Societe</th>
                      <th className="text-left p-2 border">Telephone</th>
                      <th className="text-left p-2 border">Commune</th>
                      <th className="text-left p-2 border">Code postal</th>
                      <th className="text-left p-2 border">Depot</th>
                      {colonnes.map((c) => (
                        <th key={c.id} className="text-center p-2 border">
                          {c.produits?.nom}<br/>
                          <span className="text-xs text-gray-400">{c.conditionnement}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableau.map((ligne, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="p-2 border">{ligne.nom}</td>
                        <td className="p-2 border">{ligne.prenom}</td>
                        <td className="p-2 border">{ligne.societe}</td>
                        <td className="p-2 border">{ligne.telephone}</td>
                        <td className="p-2 border">{ligne.commune}</td>
                        <td className="p-2 border">{ligne.code_postal}</td>
                        <td className="p-2 border">{ligne.depot}</td>
                        {colonnes.map((c) => (
                          <td key={c.id} className="p-2 border text-center">
                            {ligne[`produit_${c.id}`] || 0}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {/* Ligne totaux */}
                    <tr className="bg-green-50 font-semibold">
                      <td className="p-2 border" colSpan={7}>TOTAL</td>
                      {colonnes.map((c) => (
                        <td key={c.id} className="p-2 border text-center text-green-700">
                          {tableau.reduce((sum, l) => sum + (parseFloat(l[`produit_${c.id}`]) || 0), 0)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
