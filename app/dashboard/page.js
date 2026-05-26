'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [profil, setProfil] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: profilData } = await supabase
        .from('profils')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!profilData) {
        router.push('/profil')
        return
      }
      setProfil(profilData)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user || !profil) return null

  return (
    <main className="min-h-screen bg-green-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-green-800">
            Tableau de bord
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200"
          >
            Se deconnecter
          </button>
        </div>

        <p className="text-gray-600 mb-8">Bonjour, {profil.prenom} {profil.nom} 👋</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
            <h2 className="text-xl font-semibold text-green-700 mb-2">Nouvelle commande</h2>
            <p className="text-gray-500 text-sm mb-4">Passer une nouvelle commande groupee</p>
            <Link href="/commander">
              <button className="w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800">
                Commander
              </button>
            </Link>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
            <h2 className="text-xl font-semibold text-green-700 mb-2">Commandes en cours</h2>
            <p className="text-gray-500 text-sm mb-4">Voir l'etat de vos commandes</p>
            <Link href="/commandes">
              <button className="w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800">
                Voir
              </button>
            </Link>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
            <h2 className="text-xl font-semibold text-green-700 mb-2">Historique</h2>
            <p className="text-gray-500 text-sm mb-4">Consulter vos anciennes commandes</p>
            <Link href="/historique">
              <button className="w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800">
                Historique
              </button>
            </Link>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
            <h2 className="text-xl font-semibold text-green-700 mb-2">Mon profil</h2>
            <p className="text-gray-500 text-sm mb-4">Mes informations personnelles</p>
            <Link href="/profil">
              <button className="w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800">
                Modifier
              </button>
            </Link>
          </div>

          {(profil?.role === 'responsable' || profil?.role === 'admin') && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
              <h2 className="text-xl font-semibold text-blue-700 mb-2">Mon secteur</h2>
              <p className="text-gray-500 text-sm mb-4">Voir les commandes de mon secteur</p>
              <Link href="/responsable">
                <button className="w-full bg-blue-700 text-white py-2 rounded-lg hover:bg-blue-800">
                  Voir
                </button>
              </Link>
            </div>
          )}

          {profil?.role === 'admin' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
              <h2 className="text-xl font-semibold text-green-700 mb-2">Administration</h2>
              <p className="text-gray-500 text-sm mb-4">Gerer les commandes et produits</p>
              <Link href="/admin">
                <button className="w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800">
                  Acceder
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
