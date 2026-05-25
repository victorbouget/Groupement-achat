'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Profil() {
  const [profil, setProfil] = useState({
    nom: '',
    prenom: '',
    societe: '',
    telephone: '',
    adresse: '',
    commune: '',
    code_postal: '',
    depot_id: ''
  })
  const [depots, setDepots] = useState([])
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

      // Charger les depots
      const { data: depotsData } = await supabase.from('depots').select('*')
      setDepots(depotsData || [])

      // Charger le profil existant
      const { data: profilData } = await supabase
        .from('profils')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profilData) {
        setProfil(profilData)
      }
    }
    init()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('profils')
      .upsert({
        ...profil,
        user_id: user.id,
        depot_id: parseInt(profil.depot_id)
      }, { onConflict: 'user_id' })

    if (error) {
      setMessage('Erreur : ' + error.message)
    } else {
      setMessage('Profil sauvegarde !')
      setTimeout(() => router.push('/dashboard'), 1500)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-green-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-green-800 mb-8">Mon profil</h1>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Prenom</label>
              <input
                type="text"
                value={profil.prenom}
                onChange={(e) => setProfil({ ...profil, prenom: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nom</label>
              <input
                type="text"
                value={profil.nom}
                onChange={(e) => setProfil({ ...profil, nom: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Nom de societe</label>
              <input
                type="text"
                value={profil.societe}
                onChange={(e) => setProfil({ ...profil, societe: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Telephone</label>
              <input
                type="text"
                value={profil.telephone}
                onChange={(e) => setProfil({ ...profil, telephone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input
                type="text"
                disabled
                placeholder="Defini a la connexion"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-400"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Adresse</label>
              <input
                type="text"
                value={profil.adresse}
                onChange={(e) => setProfil({ ...profil, adresse: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Commune</label>
              <input
                type="text"
                value={profil.commune}
                onChange={(e) => setProfil({ ...profil, commune: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Code postal</label>
              <input
                type="text"
                value={profil.code_postal}
                onChange={(e) => setProfil({ ...profil, code_postal: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Lieu de depot</label>
              <select
                value={profil.depot_id}
                onChange={(e) => setProfil({ ...profil, depot_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Choisir un depot...</option>
                {depots.map((depot) => (
                  <option key={depot.id} value={depot.id}>{depot.nom}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full mt-6 bg-green-700 text-white py-3 rounded-lg hover:bg-green-800 disabled:opacity-50"
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>

          {message && <p className="mt-4 text-center text-green-600">{message}</p>}
        </div>
      </div>
    </main>
  )
}
