'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminInscrits() {
  const [inscrits, setInscrits] = useState([])
  const [depots, setDepots] = useState([])
  const [filtres, setFiltres] = useState({})
  const [filtreOuvert, setFiltreOuvert] = useState(null)
  const [responsableDepots, setResponsableDepots] = useState({})
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      chargerInscrits()
      chargerDepots()
    }
    init()
  }, [])

  const chargerDepots = async () => {
    const { data } = await supabase.from('depots').select('*').order('nom')
    setDepots(data || [])
  }

  const chargerInscrits = async () => {
    const { data: profils } = await supabase
      .from('profils')
      .select('*, depots(nom)')
      .order('nom')

    const { data: respDepots } = await supabase
      .from('responsable_secteur')
      .select('*, depots(nom)')

    const depotsParUser = {}
    if (respDepots) {
      respDepots.forEach((rd) => {
        if (!depotsParUser[rd.user_id]) depotsParUser[rd.user_id] = []
        // Eviter les doublons
        const dejaPresent = depotsParUser[rd.user_id].find(d => d.depot_id === rd.depot_id)
        if (!dejaPresent) depotsParUser[rd.user_id].push(rd)
      })
    }
    setResponsableDepots(depotsParUser)
    setInscrits(profils || [])
  }

  const changerRole = async (userId, role) => {
    await supabase.from('profils').update({ role }).eq('user_id', userId)
    chargerInscrits()
  }

  const ajouterDepotResponsable = async (userId, depotId) => {
    if (!depotId) return
    const depotIdInt = parseInt(depotId)
    // Verifier si deja present
    const dejaPresent = (responsableDepots[userId] || []).find(rd => rd.depot_id === depotIdInt)
    if (dejaPresent) {
      alert('Ce depot est deja assigne a cet utilisateur !')
      return
    }
    await supabase.from('responsable_secteur').insert({ user_id: userId, depot_id: depotIdInt })
    chargerInscrits()
  }

  const supprimerDepotResponsable = async (id) => {
    await supabase.from('responsable_secteur').delete().eq('id', id)
    chargerInscrits()
  }

  const tableau = inscrits.map(i => ({
    ...i,
    depot_nom: i.depots?.nom || '',
    role_label: i.role || 'adherent',
  }))

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

  const inscritsFiltres = tableau.filter(ligne => {
    return Object.entries(filtres).every(([cle, valeurs]) => {
      return valeurs.includes(String(ligne[cle] ?? ''))
    })
  })

  const colonnes = [
    { cle: 'nom', label: 'Nom' },
    { cle: 'prenom', label: 'Prenom' },
    { cle: 'societe', label: 'Societe' },
    { cle: 'telephone', label: 'Telephone' },
    { cle: 'commune', label: 'Commune' },
    { cle: 'code_postal', label: 'Code postal' },
    { cle: 'depot_nom', label: 'Depot' },
    { cle: 'role_label', label: 'Role' },
  ]

  const getRoleColor = (role) => {
    if (role === 'admin') return 'bg-red-100 text-red-700'
    if (role === 'responsable') return 'bg-blue-100 text-blue-700'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <main className="min-h-screen bg-green-50 p-8">
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-green-800">
            Inscrits
            <span className="ml-3 text-lg text-gray-400 font-normal">{inscritsFiltres.length} / {inscrits.length}</span>
          </h1>
          <Link href="/admin">
            <button className="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200">
              Retour admin
            </button>
          </Link>
        </div>

        {Object.keys(filtres).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-green-100 flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-500 font-semibold">Filtres actifs :</span>
            {Object.entries(filtres).map(([cle, valeurs]) => (
              <span key={cle} className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                {cle} : {valeurs.join(', ')}
                <button onClick={() => effacerFiltre(cle)} className="ml-1 text-green-500 hover:text-red-500">×</button>
              </span>
            ))}
            <button onClick={() => setFiltres({})} className="text-sm text-red-500 hover:underline ml-2">Effacer tout</button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-green-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-50 text-gray-600">
                {colonnes.map(({ cle, label }) => (
                  <th key={cle} className="text-left p-3 border relative">
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
                        <button onClick={() => { effacerFiltre(cle); setFiltreOuvert(null) }} className="mt-2 text-xs text-red-500 hover:underline">Effacer</button>
                      </div>
                    )}
                  </th>
                ))}
                <th className="text-left p-3 border">Changer role</th>
                <th className="text-left p-3 border">Depots secteur</th>
              </tr>
            </thead>
            <tbody>
              {inscritsFiltres.map((inscrit) => (
                <tr key={inscrit.id} className="hover:bg-gray-50 border-b">
                  <td className="p-3 border">{inscrit.nom}</td>
                  <td className="p-3 border">{inscrit.prenom}</td>
                  <td className="p-3 border">{inscrit.societe}</td>
                  <td className="p-3 border">{inscrit.telephone}</td>
                  <td className="p-3 border">{inscrit.commune}</td>
                  <td className="p-3 border">{inscrit.code_postal}</td>
                  <td className="p-3 border">{inscrit.depot_nom || 'Non renseigne'}</td>
                  <td className="p-3 border">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getRoleColor(inscrit.role_label)}`}>
                      {inscrit.role_label}
                    </span>
                  </td>
                  <td className="p-3 border">
                    <select
                      value={inscrit.role_label}
                      onChange={(e) => changerRole(inscrit.user_id, e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                    >
                      <option value="adherent">Adherent</option>
                      <option value="responsable">Responsable</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-3 border">
                    {(inscrit.role_label === 'responsable' || inscrit.role_label === 'admin') && (
                      <div className="flex flex-wrap gap-1 items-center">
                        {(responsableDepots[inscrit.user_id] || []).map((rd) => (
                          <span key={rd.id} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                            {rd.depots?.nom}
                            <button onClick={() => supprimerDepotResponsable(rd.id)} className="hover:text-red-500">×</button>
                          </span>
                        ))}
                        <select
                          id={`depot-${inscrit.user_id}`}
                          className="border border-gray-300 rounded-lg px-2 py-0.5 text-xs"
                          defaultValue=""
                        >
                          <option value="">+ Ajouter</option>
                          {depots.map((d) => (
                            <option key={d.id} value={d.id}>{d.nom}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const sel = document.getElementById(`depot-${inscrit.user_id}`)
                            ajouterDepotResponsable(inscrit.user_id, sel.value)
                            sel.value = ''
                          }}
                          className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs hover:bg-blue-200"
                        >
                          OK
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
