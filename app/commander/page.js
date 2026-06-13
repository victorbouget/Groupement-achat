'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Commander() {
  const [campagnes, setCampagnes] = useState([])
  const [campagneSelectionnee, setCampagneSelectionnee] = useState(null)
  const [produits, setProduits] = useState([])
  const [sections, setSections] = useState([])
  const [quantites, setQuantites] = useState({})
  const [dejaCommande, setDejaCommande] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data } = await supabase
        .from('campagnes')
        .select('*')
        .eq('statut', 'ouverte')
        .order('date_debut', { ascending: false })
      setCampagnes(data || [])
    }
    init()
  }, [])

  const extraireNombre = (conditionnement) => {
    if (!conditionnement) return null
    const match = conditionnement.match(/\d+[\s,.]?\d*/)
    if (!match) return null
    const nombre = parseFloat(match[0].replace(/\s/g, '').replace(',', '.'))
    return isNaN(nombre) || nombre <= 0 ? null : nombre
  }

  const genererMultiples = (conditionnement) => {
    const base = extraireNombre(conditionnement)
    if (!base) return null
    return Array.from({ length: 100 }, (_, i) => Math.round(((i + 1) * base) * 100) / 100)
  }

  const selectionnerCampagne = async (campagne) => {
    setCampagneSelectionnee(campagne)
    setQuantites({})
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()

    const { data: commandeExistante } = await supabase
      .from('commandes')
      .select('id')
      .eq('user_id', user.id)
      .eq('campagne_id', campagne.id)
      .maybeSingle()

    setDejaCommande(!!commandeExistante)

    const { data: sectionsData } = await supabase
      .from('sections')
      .select('*')
      .eq('campagne_id', campagne.id)
      .order('ordre')
    setSections(sectionsData || [])

    const { data: produitsData } = await supabase
      .from('campagne_produits')
      .select('*, produits(nom)')
      .eq('campagne_id', campagne.id)

    setProduits(produitsData || [])
  }

  const handleCommander = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const lignes = Object.entries(quantites)
      .filter(([_, q]) => q > 0)
      .map(([campagne_produit_id, quantite]) => ({
        campagne_produit_id: parseInt(campagne_produit_id),
        quantite: parseFloat(quantite)
      }))

    if (lignes.length === 0) {
      setMessage('Ajoute au moins un produit !')
      setLoading(false)
      return
    }

    const { data: commande, error } = await supabase
      .from('commandes')
      .insert({ user_id: user.id, campagne_id: campagneSelectionnee.id, statut: 'en cours' })
      .select()
      .single()

    if (error) {
      setMessage('Erreur : ' + error.message)
      setLoading(false)
      return
    }

    const commandeProduits = lignes.map((l) => ({
      commande_id: commande.id,
      produit_id: produits.find(p => p.id === l.campagne_produit_id)?.produit_id,
      quantite: l.quantite
    }))

    await supabase.from('commande_produits').insert(commandeProduits)
    setMessage('Commande envoyee avec succes !')
    setDejaCommande(true)
    setLoading(false)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  const nbProduitSelectionnee = Object.values(quantites).filter(q => q > 0).length

  const renderProduits = (produitsFiltres) => (
    <div className="flex flex-col gap-3">
      {produitsFiltres.map((cp) => {
        const multiples = genererMultiples(cp.conditionnement)
        const quantite = quantites[cp.id] || 0
        const estSelectionne = quantite > 0

        return (
          <div
            key={cp.id}
            className={`bg-white rounded-xl p-4 border transition-all ${estSelectionne ? 'border-green-400 shadow-sm' : 'border-gray-100'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 pr-4">
                <p className="font-semibold text-gray-800">{cp.produits?.nom}</p>
                <p className="text-sm text-gray-400">{cp.conditionnement}</p>
                {cp.description && (
                  <p className="text-xs text-gray-400 mt-1">{cp.description}</p>
                )}
              </div>
              <div className="flex-shrink-0">
                {multiples ? (
                  <select
                    value={quantite}
                    onChange={(e) => setQuantites({ ...quantites, [cp.id]: parseFloat(e.target.value) })}
                    className={`w-28 border rounded-xl px-2 py-2 text-center text-sm font-medium ${estSelectionne ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200'}`}
                  >
                    <option value={0}>0</option>
                    {multiples.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={quantite || ''}
                    onChange={(e) => setQuantites({ ...quantites, [cp.id]: parseFloat(e.target.value) || 0 })}
                    className={`w-24 border rounded-xl px-2 py-2 text-center text-sm font-medium ${estSelectionne ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200'}`}
                  />
                )}
              </div>
            </div>
            {estSelectionne && (
              <div className="bg-green-50 rounded-lg px-3 py-1 mt-2">
                <p className="text-green-700 text-xs font-medium">✓ {quantite} {cp.conditionnement} selectionne(s)</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <main className="min-h-screen bg-green-50">
      {/* Header */}
      <div className="bg-green-700 text-white px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Passer une commande</h1>
          <Link href="/dashboard">
            <button className="bg-green-800 text-white px-3 py-2 rounded-lg text-sm">
              Retour
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Campagnes */}
        {!campagneSelectionnee && (
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Campagnes ouvertes</h2>
            {campagnes.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-gray-500">Aucune campagne ouverte pour le moment</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {campagnes.map((campagne) => (
                  <div
                    key={campagne.id}
                    onClick={() => selectionnerCampagne(campagne)}
                    className="bg-white rounded-xl p-5 border border-gray-100 cursor-pointer active:opacity-70 shadow-sm"
                  >
                    <p className="font-bold text-gray-800 text-lg">{campagne.nom}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Jusqu'au {new Date(campagne.date_fin).toLocaleDateString('fr-FR')}
                    </p>
                    <div className="mt-3 flex justify-end">
                      <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">Commander →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Produits */}
        {campagneSelectionnee && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setCampagneSelectionnee(null)}
                className="text-green-700 text-sm"
              >
                ← Changer
              </button>
              <h2 className="font-bold text-gray-800">{campagneSelectionnee.nom}</h2>
            </div>

            {dejaCommande ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-gray-700 font-semibold mb-2">Commande deja passee</p>
                <p className="text-gray-400 text-sm">Pour modifier, contactez-nous</p>
              </div>
            ) : (
              <>
                {sections.length > 0 ? (
                  <div>
                    {sections.map((section) => {
                      const produitsDeLaSection = produits.filter(cp => cp.section_id === section.id)
                      if (produitsDeLaSection.length === 0) return null
                      return (
                        <div key={section.id} className="mb-6">
                          <h3 className="font-semibold text-blue-700 bg-blue-50 px-4 py-2 rounded-lg mb-3">
                            {section.nom}
                          </h3>
                          {renderProduits(produitsDeLaSection)}
                        </div>
                      )
                    })}
                    {produits.filter(cp => !cp.section_id).length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-500 bg-gray-50 px-4 py-2 rounded-lg mb-3">
                          Autres produits
                        </h3>
                        {renderProduits(produits.filter(cp => !cp.section_id))}
                      </div>
                    )}
                  </div>
                ) : (
                  renderProduits(produits)
                )}

                {/* Bouton commander fixe en bas */}
                <div className="sticky bottom-4 mt-6">
                  <button
                    onClick={handleCommander}
                    disabled={loading || nbProduitSelectionnee === 0}
                    className="w-full bg-green-700 text-white py-4 rounded-2xl text-lg font-bold shadow-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Envoi...' : nbProduitSelectionnee === 0 ? 'Selectionnez des produits' : `Envoyer ma commande (${nbProduitSelectionnee} produit${nbProduitSelectionnee > 1 ? 's' : ''})`}
                  </button>
                </div>
              </>
            )}

            {message && (
              <p className="mt-4 text-center text-green-700 font-semibold">{message}</p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
