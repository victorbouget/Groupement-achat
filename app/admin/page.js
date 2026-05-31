'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Admin() {
  const [commandes, setCommandes] = useState([])
  const [produits, setProduits] = useState([])
  const [onglet, setOnglet] = useState('commandes')
  const [nouveauProduit, setNouveauProduit] = useState({ nom: '', unite: '', description: '' })
  const [produitEnEdition, setProduitEnEdition] = useState(null)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profil } = await supabase.from('profils').select('role').eq('user_id', user.id).single()
      if (!profil || profil.role !== 'admin') { router.push('/dashboard'); return }
      chargerCommandes()
      chargerProduits()
    }
    init()
  }, [])

  const chargerCommandes = async () => {
    const { data } = await supabase
      .from('commandes')
      .select(`id, date_commande, statut, user_id, commande_produits (quantite, produits (nom, unite))`)
      .order('date_commande', { ascending: false })
    setCommandes(data || [])
  }

  const chargerProduits = async () => {
    const { data } = await supabase.from('produits').select('*').order('nom')
    setProduits(data || [])
  }

  const changerStatut = async (id, statut) => {
    await supabase.from('commandes').update({ statut }).eq('id', id)
    chargerCommandes()
  }

  const ajouterProduit = async () => {
    if (!nouveauProduit.nom || !nouveauProduit.unite) { setMessage('Remplis le nom et l\'unite !'); return }
    await supabase.from('produits').insert({
      nom: nouveauProduit.nom,
      unite: nouveauProduit.unite,
      description: nouveauProduit.description
    })
    setNouveauProduit({ nom: '', unite: '', description: '' })
    setMessage('Produit ajoute !')
    chargerProduits()
    setTimeout(() => setMessage(''), 2000)
  }

  const sauvegarderProduit = async () => {
    await supabase.from('produits').update({
      nom: produitEnEdition.nom,
      unite: produitEnEdition.unite,
      description: produitEnEdition.description
    }).eq('id', produitEnEdition.id)
    setProduitEnEdition(null)
    setMessage('Produit modifie !')
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

  return (
    <main className="min-h-screen bg-green-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-green-800">Administration</h1>
          <Link href="/dashboard">
            <button className="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200">Retour</button>
          </Link>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          {['commandes', 'inscrits', 'produits', 'campagnes', 'recap', 'depots', 'cotisation'].map((o) => (
            <button key={o} onClick={() => setOnglet(o)} className={`px-5 py-2 rounded-lg font-semibold capitalize ${onglet === o ? 'bg-green-700 text-white' : 'bg-white text-green-700'}`}>
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
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatutColor(commande.statut)}`}>{commande.statut}</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{new Date(commande.date_commande).toLocaleDateString('fr-FR')}</p>
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
                      <button key={s} onClick={() => changerStatut(commande.id, s)} className={`px-3 py-1 rounded-lg text-sm ${getStatutColor(s)} hover:opacity-80`}>{s}</button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* INSCRITS */}
        {onglet === 'inscrits' && (
          <div className="text-center mt-8">
            <Link href="/admin/inscrits">
              <button className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800">Voir les inscrits</button>
            </Link>
          </div>
        )}

        {/* PRODUITS */}
        {onglet === 'produits' && (
          <div>
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-green-100">
              <h2 className="text-xl font-semibold text-green-700 mb-4">Ajouter un produit</h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Nom du produit"
                  value={nouveauProduit.nom}
                  onChange={(e) => setNouveauProduit({ ...nouveauProduit, nom: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Unite (kg, litre...)"
                  value={nouveauProduit.unite}
                  onChange={(e) => setNouveauProduit({ ...nouveauProduit, unite: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Description (optionnel)"
                  value={nouveauProduit.description}
                  onChange={(e) => setNouveauProduit({ ...nouveauProduit, description: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <button onClick={ajouterProduit} className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800">Ajouter</button>
              {message && <p className="text-green-600 text-sm mt-2">{message}</p>}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
              <h2 className="text-xl font-semibold text-green-700 mb-4">Liste des produits</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="text-left pb-2">Nom</th>
                    <th className="text-left pb-2">Unite</th>
                    <th className="text-left pb-2">Description</th>
                    <th className="text-right pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {produits.map((produit) => (
                    <tr key={produit.id} className="border-b last:border-0">
                      {produitEnEdition?.id === produit.id ? (
                        <>
                          <td className="py-2">
                            <input type="text" value={produitEnEdition.nom} onChange={(e) => setProduitEnEdition({ ...produitEnEdition, nom: e.target.value })} className="w-full border border-green-300 rounded px-2 py-1 text-sm" />
                          </td>
                          <td className="py-2">
                            <input type="text" value={produitEnEdition.unite} onChange={(e) => setProduitEnEdition({ ...produitEnEdition, unite: e.target.value })} className="w-full border border-green-300 rounded px-2 py-1 text-sm" />
                          </td>
                          <td className="py-2">
                            <input type="text" value={produitEnEdition.description || ''} onChange={(e) => setProduitEnEdition({ ...produitEnEdition, description: e.target.value })} className="w-full border border-green-300 rounded px-2 py-1 text-sm" />
                          </td>
                          <td className="py-2 text-right">
                            <div className="flex gap-1 justify-end">
                              <button onClick={sauvegarderProduit} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200">Sauvegarder</button>
                              <button onClick={() => setProduitEnEdition(null)} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">Annuler</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 font-medium">{produit.nom}</td>
                          <td className="py-3 text-gray-500">{produit.unite}</td>
                          <td className="py-3 text-gray-400 text-xs">{produit.description || '-'}</td>
                          <td className="py-3 text-right">
                            <div className="flex gap-1 justify-end">
                              <button onClick={() => setProduitEnEdition({ ...produit })} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200">Modifier</button>
                              <button onClick={() => supprimerProduit(produit.id)} className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200">Supprimer</button>
                            </div>
                          </td>
                        </>
                      )}
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
              <button className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800">Gerer les campagnes</button>
            </Link>
          </div>
        )}

        {onglet === 'recap' && (
          <div className="text-center mt-8">
            <Link href="/admin/recap">
              <button className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800">Voir le recapitulatif</button>
            </Link>
          </div>
        )}

        {onglet === 'depots' && (
          <div className="text-center mt-8">
            <Link href="/admin/depots">
              <button className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800">Gerer les depots</button>
            </Link>
          </div>
        )}

        {onglet === 'cotisation' && (
          <div className="text-center mt-8">
            <Link href="/admin/cotisation">
              <button className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800">Gerer la cotisation</button>
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
