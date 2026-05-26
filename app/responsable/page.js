'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Responsable() {
  const [campagnes, setCampagnes] = useState([])
  const [campagneSelectionnee, setCampagneSelectionnee] = useState(null)
  const [depots, setDepots] = useState([])
  const [depotSelectionne, setDepotSelectionne] = useState(null)
  const [adherents, setAdherents] = useState([])
  const [colonnes, setColonnes] = useState([])
  const [colonnesFiltrees, setColonnesFiltrees] = useState([])
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Verifier le role
      const { data: profil } = await supabase
        .from('profils')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (!profil || (profil.role !== 'responsable' && profil.role !== 'admin')) {
        router.push('/dashboard')
        return
      }

      // Charger les depots du responsable
      let depotsData
      if (profil.role === 'admin') {
        const { data } = await supabase.from('depots').select('*').order('nom')
        depotsData = data
      } else {
        const { data } = await supabase
          .from('responsable_secteur')
          .select('*, depots(id, nom)')
          .eq('user_id', user.id)
        depotsData = data?.map(d => d.depots) || []
      }
      setDepots(depotsData || [])

      // Charger les campagnes
      const { data: campagnesData } = await supabase
        .from('campagnes')
        .select('*')
        .order('date_debut', { ascending: false })
      setCampagnes(campagnesData || [])
    }
    init()
  }, [])

  const chargerAdherents = async (campagne, depot) => {
    // Charger les produits de la campagne
    const { data: campagneProduits } = await supabase
      .from('campagne_produits')
      .select('*, produits(nom)')
      .eq('campagne_id', campagne.id)

    setColonnes(campagneProduits || [])
    setColonnesFiltrees(campagneProduits?.map(cp => cp.id) || [])

    // Charger tous les adherents de ce depot
    const { data: profils } = await supabase
      .from('profils')
      .select('*, depots(nom)')
      .eq('depot_id', depot.id)

    // Charger les commandes de la campagne
    const { data: commandes } = await supabase
      .from('commandes')
      .select('id, user_id, commande_produits(quantite, produit_id)')
      .eq('campagne_id', campagne.id)

    // Construire le tableau
    const lignes = (profils || []).map((profil) => {
      const commande = commandes?.find(c => c.user_id === profil.user_id)
      const ligne = {
        nom: profil.nom,
        prenom: profil.prenom,
        societe: profil.societe,
        telephone: profil.telephone,
        aCommande: !!commande,
      }

      campagneProduits?.forEach((cp) => {
        if (commande) {
          const cp_commande = commande.commande_produits.find(p => p.produit_id === cp.produit_id)
          ligne[`produit_${cp.id}`] = cp_commande?.quantite || 0
        } else {
          ligne[`produit_${cp.id}`] = null
        }
      })

      return ligne
    })

    setAdherents(lignes)
  }

  const toggleColonne = (id) => {
    if (colonnesFiltrees.includes(id)) {
      setColonnesFiltrees(colonnesFiltrees.filter(c => c !== id))
    } else {
      setColonnesFiltrees([...colonnesFiltrees, id])
    }
  }

  const colonnesVisibles = colonnes.filter(c => colonnesFiltrees.includes(c.id))

  return (
    <main className="min-h-screen bg-green-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-green-800">Mon secteur</h1>
          <Link href="/dashboard">
            <button className="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200">
              Retour
            </button>
          </Link>
        </div>

        {/* Choix campagne et depot */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-green-100">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-3">Campagne</h2>
              <div className="flex flex-col gap-2">
                {campagnes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCampagneSelectionnee(c)
                      if (depotSelectionne) chargerAdherents(c, depotSelectionne)
                    }}
                    className={`px-4 py-2 rounded-lg text-left ${campagneSelectionnee?.id === c.id ? 'bg-green-700 text-white' : 'bg-green-50 text-green-800 hover:bg-green-100'}`}
                  >
                    {c.nom}
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${c.statut === 'ouverte' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                      {c.statut}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-3">Depot</h2>
              <div className="flex flex-col gap-2">
                {depots.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setDepotSelectionne(d)
                      if (campagneSelectionnee) chargerAdherents(campagneSelectionnee, d)
                    }}
                    className={`px-4 py-2 rounded-lg text-left ${depotSelectionne?.id === d.id ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'}`}
                  >
                    {d.nom}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Filtre colonnes */}
        {colonnes.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-green-100">
            <p className="text-sm font-semibold text-gray-600 mb-2">Filtrer les produits affichés :</p>
            <div className="flex flex-wrap gap-2">
              {colonnes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggleColonne(c.id)}
                  className={`px-3 py-1 rounded-full text-sm ${colonnesFiltrees.includes(c.id) ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  {c.produits?.nom}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tableau adherents */}
        {campagneSelectionnee && depotSelectionne && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-green-700">
                {campagneSelectionnee.nom} — {depotSelectionne.nom}
              </h2>
              <div className="flex gap-3 text-sm">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  {adherents.filter(a => a.aCommande).length} commandes
                </span>
                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full">
                  {adherents.filter(a => !a.aCommande).length} en attente
                </span>
              </div>
            </div>

            {adherents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucun adherent dans ce depot</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-green-50 text-gray-600">
                      <th className="text-left p-2 border">Nom</th>
                      <th className="text-left p-2 border">Prenom</th>
                      <th className="text-left p-2 border">Societe</th>
                      <th className="text-left p-2 border">Telephone</th>
                      <th className="text-center p-2 border">Statut</th>
                      {colonnesVisibles.map((c) => (
                        <th key={c.id} className="text-center p-2 border">
                          {c.produits?.nom}<br/>
                          <span className="text-xs text-gray-400">{c.conditionnement}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {adherents.map((ligne, i) => (
                      <tr key={i} className={`${!ligne.aCommande ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                        <td className="p-2 border">{ligne.nom}</td>
                        <td className="p-2 border">{ligne.prenom}</td>
                        <td className="p-2 border">{ligne.societe}</td>
                        <td className="p-2 border">{ligne.telephone}</td>
                        <td className="p-2 border text-center">
                          {ligne.aCommande ? (
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">Commande</span>
                          ) : (
                            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">En attente</span>
                          )}
                        </td>
                        {colonnesVisibles.map((c) => (
                          <td key={c.id} className="p-2 border text-center">
                            {ligne.aCommande ? (ligne[`produit_${c.id}`] || 0) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
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
