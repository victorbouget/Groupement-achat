'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Admin() {
  const [commandes, setCommandes] = useState([])
  const [produits, setProduits] = useState([])
  const [onglet, setOnglet] = useState('commandes')
  const [nouveauProduit, setNouveauProduit] = useState({ nom: '', unite: '', prix: '' })
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      chargerCommandes()
      chargerProduits()
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
          produits (nom, unite, prix)
        )
      `)
      .order('date_commande', { ascending: false })
    setCommandes(data || [])
  }

  const chargerProduits = async () => {
    const { data } = await supabase.from('produits').select('*')
    setProduits(data || [])
  }

  const changerStatut = async (id, statut) => {
    await supabase.from('commandes').update({ statut }).eq('id', id)
    chargerCommandes()
  }

  const ajouterProduit = async () => {
    if (!nouveauProduit.nom || !nouveauProduit.unite || !nouveauProduit.prix) {
      setMessage('Remplis tous les champs !')
      return
    }
    await supabase.from('produits').insert({
      nom: nouveauProduit.nom,
      unite: nouveauProduit.unite,
      prix: parseFloat(nouveauProduit.prix)
    })
    setNouveauProduit({ nom: '', unite: '', prix: '' })
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

  return (
    <main className="min-h-screen bg-green-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-green-800">Administration</h1>
          <Link href="/dashboard">
            <button className="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200">
              Retour
            </button>
          </Link>
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setOnglet('commandes')}
            className={`px-6 py-2 rounded-lg font-semibold ${onglet === 'commandes' ? 'bg-green-700 text-white' : 'bg-white text-green-700'}`}
          >
            Commandes
          </button>
          <button
            onClick={() => setOnglet('produits')}
            className={`px-6 py-2 rounded-lg font-semibold ${onglet === 'produits' ? 'bg-green-700 text-white' : 'bg-white text-green-700'}`}
          >
            Produits
          </button>
        </div>

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
                  <p className="text-sm text-gray-500 mb-4">
                    Adherent : {commande.user_id}
                  </p>
                  <table className="w-full text-sm mb-4">
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => changerStatut(commande.id, 'en cours')}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                    >
                      En cours
                    </button>
                    <button
                      onClick={() => changerStatut(commande.id, 'validee')}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                    >
                      Valider
                    </button>
                    <button
                      onClick={() => changerStatut(commande.id, 'livree')}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                    >
                      Livree
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

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
                <input
                  type="number"
                  placeholder="Prix"
                  value={nouveauProduit.prix}
                  onChange={(e) => setNouveauProduit({ ...nouveauProduit, prix: e.target.value })}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2"
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
                    <th className="text-center pb-2">Prix</th>
                    <th className="text-right pb-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {produits.map((produit) => (
                    <tr key={produit.id} className="border-b last:border-0">
                      <td className="py-3">{produit.nom}</td>
                      <td className="py-3 text-center">{produit.unite}</td>
                      <td className="py-3 text-center">{produit.prix} euro</td>
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
      </div>
    </main>
  )
}
