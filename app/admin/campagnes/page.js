'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as XLSX from 'xlsx'

export default function AdminCampagnes() {
  const [campagnes, setCampagnes] = useState([])
  const [produits, setProduits] = useState([])
  const [nouvelle, setNouvelle] = useState({ nom: '', date_debut: '', date_fin: '', statut: 'ouverte' })
  const [campagneSelectionnee, setCampagneSelectionnee] = useState(null)
  const [campagneProduits, setCampagneProduits] = useState([])
  const [nouveauProduit, setNouveauProduit] = useState({ produit_id: '', conditionnement: '', description: '' })
  const [message, setMessage] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      chargerCampagnes()
      chargerProduits()
    }
    init()
  }, [])

  const chargerCampagnes = async () => {
    const { data } = await supabase.from('campagnes').select('*').order('date_debut', { ascending: false })
    setCampagnes(data || [])
  }

  const chargerProduits = async () => {
    const { data } = await supabase.from('produits').select('*')
    setProduits(data || [])
  }

  const chargerCampagneProduits = async (campagneId) => {
    const { data } = await supabase
      .from('campagne_produits')
      .select('*, produits(nom)')
      .eq('campagne_id', campagneId)
    setCampagneProduits(data || [])
  }

  const creerCampagne = async () => {
    if (!nouvelle.nom || !nouvelle.date_debut || !nouvelle.date_fin) {
      setMessage('Remplis tous les champs !')
      return
    }
    await supabase.from('campagnes').insert(nouvelle)
    setNouvelle({ nom: '', date_debut: '', date_fin: '', statut: 'ouverte' })
    setMessage('Campagne creee !')
    chargerCampagnes()
    setTimeout(() => setMessage(''), 2000)
  }

  const changerStatut = async (id, statut) => {
    await supabase.from('campagnes').update({ statut }).eq('id', id)
    chargerCampagnes()
  }

  const supprimerCampagne = async (id) => {
    await supabase.from('campagnes').delete().eq('id', id)
    chargerCampagnes()
    if (campagneSelectionnee?.id === id) setCampagneSelectionnee(null)
  }

  const selectionnerCampagne = (campagne) => {
    setCampagneSelectionnee(campagne)
    chargerCampagneProduits(campagne.id)
    setImportMessage('')
  }

  const ajouterProduit = async () => {
    if (!nouveauProduit.produit_id || !nouveauProduit.conditionnement) {
      setMessage('Choisis un produit et un conditionnement !')
      return
    }
    await supabase.from('campagne_produits').insert({
      campagne_id: campagneSelectionnee.id,
      produit_id: parseInt(nouveauProduit.produit_id),
      conditionnement: nouveauProduit.conditionnement,
      description: nouveauProduit.description
    })
    setNouveauProduit({ produit_id: '', conditionnement: '', description: '' })
    chargerCampagneProduits(campagneSelectionnee.id)
    setMessage('Produit ajoute !')
    setTimeout(() => setMessage(''), 2000)
  }

  const supprimerProduitCampagne = async (id) => {
    await supabase.from('campagne_produits').delete().eq('id', id)
    chargerCampagneProduits(campagneSelectionnee.id)
  }

  const importerExcel = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setImportMessage('Lecture du fichier...')

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })

        // Ignorer la ligne d'entete et les lignes vides
        const lignes = rows.slice(1).filter(row => row[0] && row[1])

        let nbAjoutes = 0
        let nbErreurs = 0

        for (const row of lignes) {
          const nomProduit = String(row[0]).trim()
          const conditionnement = String(row[1]).trim()
          const description = row[2] ? String(row[2]).trim() : ''

          // Chercher le produit existant ou le créer
          let produit = produits.find(p => p.nom.toLowerCase() === nomProduit.toLowerCase())

          if (!produit) {
            // Creer le produit s'il n'existe pas
            const { data: newProduit, error } = await supabase
              .from('produits')
              .insert({ nom: nomProduit, unite: '' })
              .select()
              .single()

            if (error) {
              nbErreurs++
              continue
            }
            produit = newProduit
          }

          // Verifier si deja dans la campagne
          const dejaPresent = campagneProduits.find(cp => cp.produit_id === produit.id)
          if (dejaPresent) continue

          // Ajouter a la campagne
          const { error } = await supabase.from('campagne_produits').insert({
            campagne_id: campagneSelectionnee.id,
            produit_id: produit.id,
            conditionnement,
            description
          })

          if (error) nbErreurs++
          else nbAjoutes++
        }

        await chargerProduits()
        await chargerCampagneProduits(campagneSelectionnee.id)
        setImportMessage(`Import termine : ${nbAjoutes} produit(s) ajoute(s)${nbErreurs > 0 ? `, ${nbErreurs} erreur(s)` : ''} !`)
        e.target.value = ''
      } catch (err) {
        setImportMessage('Erreur lors de la lecture du fichier')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const getStatutColor = (statut) => {
    return statut === 'ouverte' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
  }

  return (
    <main className="min-h-screen bg-green-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-green-800">Gestion des campagnes</h1>
          <Link href="/admin">
            <button className="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200">
              Retour admin
            </button>
          </Link>
        </div>

        {/* Creer une campagne */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-green-100">
          <h2 className="text-xl font-semibold text-green-700 mb-4">Nouvelle campagne</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Nom de la campagne</label>
              <input
                type="text"
                placeholder="Ex: Semences Mais 2026"
                value={nouvelle.nom}
                onChange={(e) => setNouvelle({ ...nouvelle, nom: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date d'ouverture</label>
              <input
                type="date"
                value={nouvelle.date_debut}
                onChange={(e) => setNouvelle({ ...nouvelle, date_debut: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date de fermeture</label>
              <input
                type="date"
                value={nouvelle.date_fin}
                onChange={(e) => setNouvelle({ ...nouvelle, date_fin: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <button
            onClick={creerCampagne}
            className="bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800"
          >
            Creer la campagne
          </button>
          {message && <p className="mt-3 text-green-600 text-sm">{message}</p>}
        </div>

        {/* Liste des campagnes */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          {campagnes.map((campagne) => (
            <div
              key={campagne.id}
              className={`bg-white rounded-xl shadow-sm p-6 border cursor-pointer ${campagneSelectionnee?.id === campagne.id ? 'border-green-500' : 'border-green-100'}`}
              onClick={() => selectionnerCampagne(campagne)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">{campagne.nom}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {new Date(campagne.date_debut).toLocaleDateString('fr-FR')} → {new Date(campagne.date_fin).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatutColor(campagne.statut)}`}>
                    {campagne.statut}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); changerStatut(campagne.id, campagne.statut === 'ouverte' ? 'fermee' : 'ouverte') }}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                  >
                    {campagne.statut === 'ouverte' ? 'Fermer' : 'Ouvrir'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); supprimerCampagne(campagne.id) }}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Produits de la campagne selectionnee */}
        {campagneSelectionnee && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
            <h2 className="text-xl font-semibold text-green-700 mb-4">
              Produits de : {campagneSelectionnee.nom}
            </h2>

            {/* Import Excel */}
            <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
              <p className="text-sm font-semibold text-green-700 mb-3">Importer depuis Excel</p>
              <div className="flex gap-3 items-center">
                <a
                  href="/modele_import_produits.xlsx"
                  download
                  className="bg-white text-green-700 border border-green-300 px-4 py-2 rounded-lg text-sm hover:bg-green-50"
                >
                  Telecharger le modele
                </a>
                <label className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-800 cursor-pointer">
                  Importer un fichier Excel
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={importerExcel}
                    className="hidden"
                  />
                </label>
              </div>
              {importMessage && (
                <p className="mt-2 text-sm text-green-700">{importMessage}</p>
              )}
            </div>

            {/* Ajout manuel */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <select
                value={nouveauProduit.produit_id}
                onChange={(e) => setNouveauProduit({ ...nouveauProduit, produit_id: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Choisir un produit...</option>
                {produits.map((p) => (
                  <option key={p.id} value={p.id}>{p.nom}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Conditionnement (ex: sac 25kg)"
                value={nouveauProduit.conditionnement}
                onChange={(e) => setNouveauProduit({ ...nouveauProduit, conditionnement: e.target.value })}
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
            <button
              onClick={ajouterProduit}
              className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 mb-6"
            >
              Ajouter le produit
            </button>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="text-left pb-2">Produit</th>
                  <th className="text-left pb-2">Conditionnement</th>
                  <th className="text-left pb-2">Description</th>
                  <th className="text-right pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {campagneProduits.map((cp) => (
                  <tr key={cp.id} className="border-b last:border-0">
                    <td className="py-2">{cp.produits?.nom}</td>
                    <td className="py-2">{cp.conditionnement}</td>
                    <td className="py-2 text-gray-500">{cp.description}</td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => supprimerProduitCampagne(cp.id)}
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
        )}
      </div>
    </main>
  )
}
