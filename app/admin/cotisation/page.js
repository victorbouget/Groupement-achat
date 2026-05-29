'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminCotisation() {
  const [parametres, setParametres] = useState({ cotisation_montant: 50, cotisation_active: false })
  const [adherents, setAdherents] = useState([])
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
      chargerParametres()
      chargerAdherents()
    }
    init()
  }, [])

  const chargerParametres = async () => {
    const { data } = await supabase.from('parametres').select('*').single()
    if (data) setParametres(data)
  }

  const chargerAdherents = async () => {
    const { data } = await supabase
      .from('profils')
      .select('nom, prenom, societe, cotisation_payee, cotisation_annee, user_id')
      .order('nom')
    setAdherents(data || [])
  }

  const sauvegarderParametres = async () => {
    setLoading(true)
    const { data: existing } = await supabase.from('parametres').select('id').single()

    if (existing) {
      await supabase.from('parametres').update(parametres).eq('id', existing.id)
    } else {
      await supabase.from('parametres').insert(parametres)
    }

    setMessage('Parametres sauvegardes !')
    setLoading(false)
    setTimeout(() => setMessage(''), 2000)
  }

  const toggleCotisationAdherent = async (userId, payee) => {
    await supabase.from('profils').update({
      cotisation_payee: !payee,
      cotisation_annee: !payee ? new Date().getFullYear() : null
    }).eq('user_id', userId)
    chargerAdherents()
  }

  const annee = new Date().getFullYear()
  const nbPayes = adherents.filter(a => a.cotisation_payee && a.cotisation_annee === annee).length

  return (
    <main className="min-h-screen bg-green-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-green-800">Gestion de la cotisation</h1>
          <Link href="/admin">
            <button className="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200">
              Retour admin
            </button>
          </Link>
        </div>

        {/* Parametres */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-green-100">
          <h2 className="text-xl font-semibold text-green-700 mb-4">Parametres de la cotisation</h2>
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Montant (€)</label>
              <input
                type="number"
                value={parametres.cotisation_montant}
                onChange={(e) => setParametres({ ...parametres, cotisation_montant: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setParametres({ ...parametres, cotisation_active: !parametres.cotisation_active })}
                  className={`w-12 h-6 rounded-full transition-colors ${parametres.cotisation_active ? 'bg-green-600' : 'bg-gray-300'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${parametres.cotisation_active ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                <span className="text-gray-700 font-medium">
                  Cotisation {parametres.cotisation_active ? 'activee' : 'desactivee'}
                </span>
              </label>
              <p className="text-xs text-gray-400 mt-1">
                {parametres.cotisation_active
                  ? 'Les adherents doivent payer pour acceder au site'
                  : 'Les adherents peuvent acceder sans payer'}
              </p>
            </div>
          </div>
          <button
            onClick={sauvegarderParametres}
            disabled={loading}
            className="bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800 disabled:opacity-50"
          >
            Sauvegarder
          </button>
          {message && <p className="mt-3 text-green-600 text-sm">{message}</p>}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-green-100 text-center">
            <p className="text-3xl font-bold text-green-700">{nbPayes}</p>
            <p className="text-sm text-gray-500">Cotisations payees {annee}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-red-100 text-center">
            <p className="text-3xl font-bold text-red-500">{adherents.length - nbPayes}</p>
            <p className="text-sm text-gray-500">En attente de paiement</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-blue-100 text-center">
            <p className="text-3xl font-bold text-blue-600">{nbPayes * parametres.cotisation_montant} €</p>
            <p className="text-sm text-gray-500">Total encaisse {annee}</p>
          </div>
        </div>

        {/* Liste adherents */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <h2 className="text-xl font-semibold text-green-700 mb-4">Statut des adherents</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b">
                <th className="text-left pb-2">Nom</th>
                <th className="text-left pb-2">Prenom</th>
                <th className="text-left pb-2">Societe</th>
                <th className="text-center pb-2">Statut {annee}</th>
                <th className="text-center pb-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {adherents.map((adherent) => {
                const payeCetteAnnee = adherent.cotisation_payee && adherent.cotisation_annee === annee
                return (
                  <tr key={adherent.user_id} className="border-b last:border-0">
                    <td className="py-3">{adherent.nom}</td>
                    <td className="py-3">{adherent.prenom}</td>
                    <td className="py-3">{adherent.societe}</td>
                    <td className="py-3 text-center">
                      {payeCetteAnnee ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">Paye</span>
                      ) : (
                        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs">En attente</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => toggleCotisationAdherent(adherent.user_id, payeCetteAnnee)}
                        className={`px-3 py-1 rounded-lg text-xs ${payeCetteAnnee ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                      >
                        {payeCetteAnnee ? 'Annuler' : 'Valider manuellement'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
