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
  const [filtres, setFiltres] = useState({})
  const [filtreOuvert, setFiltreOuvert] = useState(null)
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
    setFiltres({})
    setFiltreOuvert(null)

    const { data: campagneProduits } = await supabase
      .from('campagne_produits')
      .select('*, produits(nom)')
      .eq('campagne_id', campagne.id)

    setColonnes(campagneProduits || [])

    const { data: commandes } = await supabase
      .from('commandes')
      .select('id, user_id, commande_produits(quantite, produit_id)')
      .eq('campagne_id', campagne.id)

    if (!commandes || commandes.length === 0) {
      setTableau([])
      return
    }

    const userIds = commandes.map(c => c.user_id)
    const { data: profils } = await supabase
      .from('profils')
      .select('*, depots(nom)')
      .in('user_id', userIds)

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
      campagneProduits.forEach((cp) => {
        const commandeProduit = commande.commande_produits.find(p => p.produit_id === cp.produit_id)
        ligne[`produit_${cp.id}`] = commandeProduit?.quantite !== undefined ? commandeProduit.quantite : 0
      })
      return ligne
    })

    setTableau(lignes)
  }

  // Obtenir les valeurs uniques d'une colonne
  const getValeursUniques = (cle) => {
    const valeurs = tableau.map(l => String(l[cle] ?? ''))
    return [...new Set(valeurs)].sort()
  }

  const toggleFiltre = (cle, valeur) => {
    setFiltres(prev => {
      const current = prev[cle] || []
      if (current.includes(valeur)) {
        const updated = current.filter(v => v !== valeur)
        if (updated.length === 0) {
          const { [cle]: _, ...rest } = prev
          return rest
        }
        return { ...prev, [cle]: updated }
      } else {
        return { ...prev, [cle]: [...current, valeur] }
      }
    })
  }

  const effacerFiltre = (cle) => {
    setFiltres(prev => {
      const { [cle]: _, ...rest } = prev
      return rest
    })
  }

  const tableauFiltre = tableau.filter(ligne => {
    return Object.entries(filtres).every(([cle, valeurs]) => {
      return valeurs.includes(String(ligne[cle] ?? ''))
    })
  })

  const exporterExcel = () => {
    if (tableauFiltre.length === 0) return
    const headers = ['Nom', 'Prenom', 'Societe', 'Telephone', 'Commune', 'Code postal', 'Depot',
      ...colonnes.map(c => `${c.produits?.nom} (${c.conditionnement})`)]
    const rows = tableauFiltre.map(ligne => [
      ligne.nom, ligne.prenom, ligne.societe, ligne.telephone,
      ligne.commune, ligne.code_postal, ligne.depot,
      ...colonnes.map(c => ligne[`produit_${c.id}`] || 0)
    ])
    const totaux = ['', '', '', '', '', '', 'TOTAL',
      ...colonnes.map(c => tableauFiltre.reduce((sum, l) => sum + (parseFloat(l[`produit_${c.id}`]) || 0), 0))]
    const csvContent = [headers, ...rows, totaux].map(row => row.join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recap_${campagneSelectionnee.nom}.csv`
    a.click()
  }

  const colonnesInfos = [
    { cle: 'nom', label: 'Nom' },
    { cle: 'prenom', label: 'Prenom' },
    { cle: 'societe', label: 'Societe' },
    { cle: 'telephone', label: 'Telephone' },
    { cle: 'commune', label: 'Commune' },
    { cle: 'code_postal', label: 'Code postal' },
    { cle: 'depot', label: 'Depot' },
  ]

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

        {/* Filtres actifs */}
        {Object.keys(filtres).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-green-100 flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-500 font-semibold">Filtres actifs :</span>
            {Object.entries(filtres).map(([cle, valeurs]) => (
              <span key={cle} className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                {cle} : {valeurs.join(', ')}
                <button onClick={() => effacerFiltre(cle)} className="ml-1 text-green-500 hover:text-red-500">×</button>
              </span>
            ))}
            <button onClick={() => setFiltres({})} className="text-sm text-red-500 hover:underline ml-2">
              Effacer tout
            </button>
          </div>
        )}

        {campagneSelectionnee && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-green-700">
                {campagneSelectionnee.nom}
                <span className="ml-3 text-sm text-gray-400">{tableauFiltre.length} ligne(s)</span>
              </h2>
              <button onClick={exporterExcel} className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800">
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
                      {colonnesInfos.map(({ cle, label }) => (
                        <th key={cle} className="text-left p-2 border relative">
                          <div className="flex items-center gap-1">
                            {label}
                            <button
                              onClick={() => setFiltreOuvert(filtreOuvert === cle ? null : cle)}
                              className={`text-xs px-1 rounded ${filtres[cle] ? 'text-green-700 font-bold' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                              ▼
                            </button>
                          </div>
                          {filtreOuvert === cle && (
                            <div className="absolute top-full left-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-40">
                              <p className="text-xs text-gray-500 mb-2 font-semibold">Filtrer par {label}</p>
                              {getValeursUniques(cle).map((valeur) => (
                                <label key={valeur} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-1">
                                  <input
                                    type="checkbox"
                                    checked={(filtres[cle] || []).includes(valeur)}
                                    onChange={() => toggleFiltre(cle, valeur)}
                                    className="accent-green-700"
                                  />
                                  <span className="text-sm">{valeur || '(vide)'}</span>
                                </label>
                              ))}
                              <button onClick={() => { effacerFiltre(cle); setFiltreOuvert(null) }} className="mt-2 text-xs text-red-500 hover:underline">
                                Effacer
                              </button>
                            </div>
                          )}
                        </th>
                      ))}
                      {colonnes.map((c) => (
                        <th key={c.id} className="text-center p-2 border relative">
                          <div className="flex items-center justify-center gap-1">
                            <span>{c.produits?.nom}<br/><span className="text-xs text-gray-400">{c.conditionnement}</span></span>
                            <button
                              onClick={() => setFiltreOuvert(filtreOuvert === `produit_${c.id}` ? null : `produit_${c.id}`)}
                              className={`text-xs px-1 rounded ${filtres[`produit_${c.id}`] ? 'text-green-700 font-bold' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                              ▼
                            </button>
                          </div>
                          {filtreOuvert === `produit_${c.id}` && (
                            <div className="absolute top-full left-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-32">
                              <p className="text-xs text-gray-500 mb-2 font-semibold">Filtrer</p>
                              {getValeursUniques(`produit_${c.id}`).map((valeur) => (
                                <label key={valeur} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-1">
                                  <input
                                    type="checkbox"
                                    checked={(filtres[`produit_${c.id}`] || []).includes(valeur)}
                                    onChange={() => toggleFiltre(`produit_${c.id}`, valeur)}
                                    className="accent-green-700"
                                  />
                                  <span className="text-sm">{valeur}</span>
                                </label>
                              ))}
                              <button onClick={() => { effacerFiltre(`produit_${c.id}`); setFiltreOuvert(null) }} className="mt-2 text-xs text-red-500 hover:underline">
                                Effacer
                              </button>
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableauFiltre.map((ligne, i) => (
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
                    <tr className="bg-green-50 font-semibold">
                      <td className="p-2 border" colSpan={7}>TOTAL ({tableauFiltre.length} lignes)</td>
                      {colonnes.map((c) => (
                        <td key={c.id} className="p-2 border text-center text-green-700">
                          {tableauFiltre.reduce((sum, l) => sum + (parseFloat(l[`produit_${c.id}`]) || 0), 0)}
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
