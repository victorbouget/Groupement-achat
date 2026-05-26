'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Admin() {
  const [commandes, setCommandes] = useState([])
  const [produits, setProduits] = useState([])
  const [inscrits, setInscrits] = useState([])
  const [depots, setDepots] = useState([])
  const [onglet, setOnglet] = useState('commandes')
  const [nouveauProduit, setNouveauProduit] = useState({ nom: '', unite: '' })
  const [message, setMessage] = useState('')
  const [responsableDepots, setResponsableDepots] = useState({})
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
     const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      // Verifier le role admin
      const { data: profil } = await supabase
        .from('profils')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (!profil || profil.role !== 'admin') {
        router.push('/dashboard')
        return
      }
      chargerCommandes()
      chargerProduits()
      chargerInscrits()
      chargerDepots()
    }
    init()
  }, [])

  const chargerCommandes = async () => {
    const { data } = await supabase
      .from('commandes')
      .select(`
        id,
        date_commande,
        statut,
        user_id,
        commande_produits (
          quantite,
          produits (nom, unite)
        )
      `)
      .order('date_commande', { ascending: false })
    setCommandes(data || [])
  }

  const chargerProduits = async () => {
    const { data } = await supabase.from('produits').select('*')
    setProduits(data || [])
  }

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

    // Grouper les depots par user_id
    const depotsParUser = {}
    if (respDepots) {
      respDepots.forEach((rd) => {
        if (!depotsParUser[rd.user_id]) depotsParUser[rd.user_id] = []
        depotsParUser[rd.user_id].push(rd)
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
    // Verifier si deja present
    const dejaPresent = (responsableDepots[userId] || []).find(rd => rd.depot_id === parseInt(depotId))
    if (dejaPresent) return
    await supabase.from('responsable_secteur').insert({ user_id: userId, depot_id: parseInt(depotId) })
    chargerInscrits()
  }

  const supprimerDepotResponsable = async (id) => {
    await supabase.from('responsable_secteur').delete().eq('id', id)
    chargerInscrits()
  }

  const changerStatut = async (id, statut) => {
    await supabase.from('commandes').update({ statut }).eq('id', id)
    chargerCommandes()
  }

  const ajouterProduit = async () => {
    if (!nouveauProduit.nom || !nouveauProduit.unite) {
      setMessage('Remplis tous les champs !')
      return
    }
    await supabase.from('produits').insert({
      nom: nouveauProduit.nom,
      unite: nouveauProduit.unite,
    })
    setNouveauProduit({ nom: '', unite: '' })
    setMessage('Produit ajoute !')
    chargerProduits()
    setTimeout(() => setMessage(''), 2000)
  }

  const supprimerProduit = async (id) => {
    await supabase.from('produits').delete().eq('id', id)
    chargerProduits()
  }

  const getStatutColor = (statut) => {
    if (statut === 'livree') return 'bg-gray-100 text-gray-600'
    if (statut === 'validee') return 'bg-blue-100 text-blue-700'
    return 'bg-green-100 text-green-700'
  }

  const getRoleColor = (role) => {
    if (role === 'admin') return 'bg-red-100 text-red-700'
    if (role === 'responsable') return 'bg-blue-100 text-blue-700'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <main className="min-h-screen bg-green-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-green-800">Administration</h1>
          <Link href="/dashboard">
            <button className="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200">
              Retour
            </button>
          </Link>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          {['commandes', 'inscrits', 'produits', 'campagnes', 'recap', 'depots'].map((o) => (
            <button
              key={o}
              onClick={() => setOnglet(o)}
              className={`px-5 py-2 rounded-lg font-semibold capitalize ${onglet === o ? 'bg-green-700 text-white' : 'bg-white text-green-700'}`}
            >
              {o}
            </button>
          ))}
        </div>

        {/* COMMANDES */}
        {onglet === 'commandes' && (
          <div>
            {commandes.length === 0 ? (
              <p className="text-gray-500 text-center mt-20">Aucune commande</p>
            ) : (
              commandes.map((commande) => (
                <div key={commande.id} className="bg-white rounded-xl shadow-sm p-6 mb-4 border border-green-100">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-gray-700">Commande #{commande.id}</p>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatutColor(commande.statut)}`}>
                      {commande.statut}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">
                    {new Date(commande.date_commande).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">Adherent : {commande.user_id}</p>
                  <table className="w-full text-sm mb-4">
                    <thead>
                      <tr className="text-gray-500 border-b">
                        <th className="text-left pb-2">Produit</th>
                        <th className="text-center pb-2">Quantite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commande.commande_produits.map((ligne, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2">{ligne.produits?.nom}</td>
                          <td className="py-2 text-center">{ligne.quantite} {ligne.produits?.unite}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex gap-2">
                    {['en cours', 'validee', 'livree'].map((s) => (
                      <button
                        key={s}
                        onClick={() => changerStatut(commande.id, s)}
                        className={`px-3 py-1 rounded-lg text-sm ${getStatutColor(s)} hover:opacity-80`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* INSCRITS */}
        {onglet === 'inscrits' && (
          <div>
            {inscrits.length === 0 ? (
              <p className="text-gray-500 text-center mt-20">Aucun inscrit</p>
            ) : (
              inscrits.map((inscrit) => (
                <div key={inscrit.id} className="bg-white rounded-xl shadow-sm p-6 mb-4 border border-green-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">{inscrit.prenom} {inscrit.nom}</p>
                      <p className="text-sm text-gray-500">{inscrit.societe}</p>
                      <p className="text-sm text-gray-400">{inscrit.telephone} • {inscrit.commune} {inscrit.code_postal}</p>
                      <p className="text-sm text-gray-400">Depot : {inscrit.depots?.nom || 'Non renseigne'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${getRoleColor(inscrit.role)}`}>
                        {inscrit.role || 'adherent'}
                      </span>
                      <select
                        value={inscrit.role || 'adherent'}
                        onChange={(e) => changerRole(inscrit.user_id, e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                      >
                        <option value="adherent">Adherent</option>
                        <option value="responsable">Responsable</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  {/* Depots du responsable */}
                  {(inscrit.role === 'responsable' || inscrit.role === 'admin') && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm font-semibold text-gray-600 mb-2">Depots assignes :</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(responsableDepots[inscrit.user_id] || []).map((rd) => (
                          <span key={rd.id} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                            {rd.depots?.nom}
                            <button
                              onClick={() => supprimerDepotResponsable(rd.id)}
                              className="ml-1 text-blue-400 hover:text-red-500"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        {(responsableDepots[inscrit.user_id] || []).length === 0 && (
                          <p className="text-sm text-gray-400">Aucun depot assigne</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <select
                          id={`depot-select-${inscrit.user_id}`}
                          className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                        >
                          <option value="">Ajouter un depot...</option>
                          {depots.map((d) => (
                            <option key={d.id} value={d.id}>{d.nom}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const sel = document.getElementById(`depot-select-${inscrit.user_id}`)
                            ajouterDepotResponsable(inscrit.user_id, sel.value)
                            sel.value = ''
                          }}
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm hover:bg-blue-200"
                        >
                          Ajouter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* PRODUITS */}
        {onglet === 'produits' && (
          <div>
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-green-100">
              <h2 className="text-xl font-semibold text-green-700 mb-4">Ajouter un produit</h2>
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Nom du produit"
                  value={nouveauProduit.nom}
                  onChange={(e) => setNouveauProduit({ ...nouveauProduit, nom: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Unite (kg, litre...)"
                  value={nouveauProduit.unite}
                  onChange={(e) => setNouveauProduit({ ...nouveauProduit, unite: e.target.value })}
                  className="w-32 border border-gray-300 rounded-lg px-3 py-2"
                />
                <button
                  onClick={ajouterProduit}
                  className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800"
                >
                  Ajouter
                </button>
              </div>
              {message && <p className="text-green-600 text-sm">{message}</p>}
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
              <h2 className="text-xl font-semibold text-green-700 mb-4">Liste des produits</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="text-left pb-2">Nom</th>
                    <th className="text-center pb-2">Unite</th>
                    <th className="text-right pb-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {produits.map((produit) => (
                    <tr key={produit.id} className="border-b last:border-0">
                      <td className="py-3">{produit.nom}</td>
                      <td className="py-3 text-center">{produit.unite}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => supprimerProduit(produit.id)}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {onglet === 'campagnes' && (
          <div className="text-center mt-8">
            <Link href="/admin/campagnes">
              <button className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800">
                Gerer les campagnes
              </button>
            </Link>
          </div>
        )}

        {onglet === 'recap' && (
          <div className="text-center mt-8">
            <Link href="/admin/recap">
              <button className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800">
                Voir le recapitulatif
              </button>
            </Link>
          </div>
        )}

        {onglet === 'depots' && (
          <div className="text-center mt-8">
            <Link href="/admin/depots">
              <button className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800">
                Gerer les depots
              </button>
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
