'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDepots() {
  const [depots, setDepots] = useState([])
  const [nouveau, setNouveau] = useState({ nom: '', adresse: '' })
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      chargerDepots()
    }
    init()
  }, [])

  const chargerDepots = async () => {
    const { data } = await supabase.from('depots').select('*').order('nom')
    setDepots(data || [])
  }

  const ajouterDepot = async () => {
    if (!nouveau.nom) {
      setMessage('Le nom du depot est obligatoire !')
      return
    }
    await supabase.from('depots').insert(nouveau)
    setNouveau({ nom: '', adresse: '' })
    setMessage('Depot ajoute !')
    chargerDepots()
    setTimeout(() => setMessage(''), 2000)
  }

  const supprimerDepot = async (id) => {
    await supabase.from('depots').delete().eq('id', id)
    chargerDepots()
  }

  return (
    <main className="min-h-screen bg-green-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-green-800">Gestion des depots</h1>
          <Link href="/admin">
            <button className="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200">
              Retour admin
            </button>
          </Link>
        </div>

        {/* Ajouter un depot */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-green-100">
          <h2 className="text-xl font-semibold text-green-700 mb-4">Ajouter un depot</h2>
          <div className="flex flex-col gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nom du depot</label>
              <input
                type="text"
                placeholder="Ex: Depot de Auch"
                value={nouveau.nom}
                onChange={(e) => setNouveau({ ...nouveau, nom: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Adresse (optionnel)</label>
              <input
                type="text"
                placeholder="Ex: 10 rue des champs, Auch"
                value={nouveau.adresse}
                onChange={(e) => setNouveau({ ...nouveau, adresse: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <button
            onClick={ajouterDepot}
            className="bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800"
          >
            Ajouter
          </button>
          {message && <p className="mt-3 text-green-600 text-sm">{message}</p>}
        </div>

        {/* Liste des depots */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <h2 className="text-xl font-semibold text-green-700 mb-4">Liste des depots</h2>
          {depots.length === 0 ? (
            <p className="text-gray-500">Aucun depot pour le moment</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="text-left pb-2">Nom</th>
                  <th className="text-left pb-2">Adresse</th>
                  <th className="text-right pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {depots.map((depot) => (
                  <tr key={depot.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{depot.nom}</td>
                    <td className="py-3 text-gray-500">{depot.adresse}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => supprimerDepot(depot.id)}
                        className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  )
}
