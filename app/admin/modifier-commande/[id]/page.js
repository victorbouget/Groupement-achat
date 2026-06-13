'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function ModifierCommande() {
  const [commande, setCommande] = useState(null)
  const [commandeProduits, setCommandeProduits] = useState([])
  const [quantitesModifiees, setQuantitesModifiees] = useState({})
  const [produitsDispo, setProduitsDispo] = useState([])
  const [nouveauProduit, setNouveauProduit] = useState({ produit_id: '', quantite: '' })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useParams()
  const commandeId = params.id

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profil } = await supabase.from('profils').select('role').eq('user_id', user.id).single()
      if (!profil || profil.role !== 'admin') { router.push('/dashboard'); return }

      chargerCommande()
      chargerProduits()
    }
    init()
  }, [])

  const chargerCommande = async () => {
    const { data } = await supabase
      .from('commandes')
      .select(`
        id, statut, date_commande, user_id,
        campagnes (nom),
        commande_produits (id, quantite, produits (id, nom, unite))
      `)
      .eq('id', commandeId)
      .single()

    if (data) {
      // Charger le profil de l'adherent
      const { data: profil } = await supabase
        .from('profils')
        .select('nom, prenom, societe')
        .eq('user_id', data.user_id)
        .single()

      setCommande({ ...data, profil })
      setCommandeProduits(data.commande_produits || [])

      // Initialiser les quantites
      const q = {}
      data.commande_produits?.forEach(cp => {
        q[cp.id] = cp.quantite
      })
      setQuantitesModifiees(q)
    }
  }

  const chargerProduits = async () => {
    const { data } = await supabase.from('produits').select('*').order('nom')
    setProduitsDispo(data || [])
  }

  const sauvegarderQuantites = async () => {
    setLoading(true)
    for (const [id, quantite] of Object.entries(quantitesModifiees)) {
      await supabase
        .from('commande_produits')
        .update({ quantite: parseFloat(quantite) })
        .eq('id', id)
    }
    setMessage('Commande sauvegardee !')
    setLoading(false)
    setTimeout(() => setMessage(''), 2000)
  }

  const supprimerProduit = async (commandeProduitId) => {
    await supabase.from('commande_produits').delete().eq('id', commandeProduitId)
    chargerCommande()
  }

  const ajouterProduit = async () => {
    if (!nouveauProduit.produit_id || !nouveauProduit.quantite) {
      setMessage('Choisis un produit et une quantite !')
      return
    }
    setLoading(true)
    await supabase.from('commande_produits').insert({
      commande_id: parseInt(commandeId),
      produit_id: parseInt(nouveauProduit.produit_id),
      quantite: parseFloat(nouveauProduit.quantite)
    })
    setNouveauProduit({ produit_id: '', quantite: '' })
    setMessage('Produit ajoute !')
    chargerCommande()
    setLoading(false)
    setTimeout(() => setMessage(''), 2000)
  }

  if (!commande) return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center">
      <p className="text-gray-500">Chargement...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-green-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-green-800">Modifier la commande</h1>
          <Link href="/admin">
            <button className="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200">
              Retour admin
            </button>
          </Link>
        </div>

        {/* Infos commande */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-green-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-gray-800 text-lg">
                {commande.profil ? `${commande.profil.prenom} ${commande.profil.nom}` : commande.user_id}
              </p>
              <p className="text-gray-500 text-sm">{commande.profil?.societe}</p>
              {commande.campagnes?.nom && (
                <p className="text-green-600 text-sm font-medium mt-1">{commande.campagnes.nom}</p>
              )}
              <p className="text-gray-400 text-sm mt-1">
                {new Date(commande.date_commande).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
              {commande.statut}
            </span>
          </div>
        </div>

        {/* Produits de la commande */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-green-100">
          <h2 className="text-xl font-semibold text-green-700 mb-4">Produits commandes</h2>
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-gray-500 border-b">
                <th className="text-left pb-2">Produit</th>
                <th className="text-center pb-2">Quantite</th>
                <th className="text-right pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {commandeProduits.map((ligne) => (
                <tr key={ligne.id} className="border-b last:border-0">
                  <td className="py-3">{ligne.produits?.nom}</td>
                  <td className="py-3 text-center">
                    <input
                      type="number"
                      min="0"
                      value={quantitesModifiees[ligne.id] ?? ligne.quantite}
                      onChange={(e) => setQuantitesModifiees({ ...quantitesModifiees, [ligne.id]: e.target.value })}
                      className="w-24 border border-gray-300 rounded-lg px-2 py-1 text-center"
                    />
                    <span className="ml-1 text-gray-400 text-xs">{ligne.produits?.unite}</span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => supprimerProduit(ligne.id)}
                      className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={sauvegarderQuantites}
            disabled={loading}
            className="w-full bg-green-700 text-white py-3 rounded-lg hover:bg-green-800 disabled:opacity-50 font-semibold"
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
          </button>

          {message && <p className="mt-3 text-center text-green-600 font-medium">{message}</p>}
        </div>

        {/* Ajouter un produit */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <h2 className="text-xl font-semibold text-green-700 mb-4">Ajouter un produit</h2>
          <div className="flex gap-4 mb-4">
            <select
              value={nouveauProduit.produit_id}
              onChange={(e) => setNouveauProduit({ ...nouveauProduit, produit_id: e.target.value })}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Choisir un produit...</option>
              {produitsDispo.map((p) => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              placeholder="Quantite"
              value={nouveauProduit.quantite}
              onChange={(e) => setNouveauProduit({ ...nouveauProduit, quantite: e.target.value })}
              className="w-32 border border-gray-300 rounded-lg px-3 py-2"
            />
            <button
              onClick={ajouterProduit}
              disabled={loading}
              className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 disabled:opacity-50"
            >
              Ajouter
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
