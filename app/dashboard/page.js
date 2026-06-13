'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { demanderPermissionNotification } from '../lib/firebase'

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

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/firebase-messaging-sw.js')
          .catch((error) => console.error('Erreur Service Worker:', error))
      }

      const { data: profilData } = await supabase
        .from('profils')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!profilData) {
        router.push('/profil')
        return
      }

      // Verifier si le compte est valide
      if (!profilData.valide) {
        router.push('/attente')
        return
      }

      const annee = new Date().getFullYear()
      if (profilData.cotisation_annee !== annee || !profilData.cotisation_payee) {
        const { data: params } = await supabase
          .from('parametres')
          .select('cotisation_active')
          .single()
        if (params?.cotisation_active) {
          router.push('/cotisation')
          return
        }
      }

      setProfil(profilData)

      const token = await demanderPermissionNotification()
      if (token) {
        const { data: existingToken } = await supabase
          .from('notification_tokens')
          .select('id')
          .eq('user_id', user.id)
          .eq('token', token)
          .maybeSingle()
        if (!existingToken) {
          await supabase.from('notification_tokens').insert({ user_id: user.id, token })
        }
      }
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user || !profil) return null

  const menuItems = [
    {
      href: '/commander',
      icon: '🛒',
      label: 'Commander',
      description: 'Passer une commande',
      color: 'bg-green-700',
    },
    {
      href: '/historique',
      icon: '📋',
      label: 'Historique',
      description: 'Mes commandes',
      color: 'bg-green-600',
    },
    {
      href: '/profil',
      icon: '👤',
      label: 'Mon profil',
      description: 'Mes informations',
      color: 'bg-green-500',
    },
    ...(profil?.role === 'responsable' || profil?.role === 'admin' ? [{
      href: '/responsable',
      icon: '📊',
      label: 'Mon secteur',
      description: 'Commandes du secteur',
      color: 'bg-blue-600',
    }] : []),
    ...(profil?.role === 'admin' ? [{
      href: '/admin',
      icon: '⚙️',
      label: 'Administration',
      description: 'Gerer le groupement',
      color: 'bg-gray-700',
    }] : []),
  ]

  return (
    <main className="min-h-screen bg-green-50">
      <div className="bg-green-700 text-white px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-green-200 text-sm mb-1">Bonjour 👋</p>
              <h1 className="text-2xl font-bold">{profil.prenom} {profil.nom}</h1>
              <p className="text-green-200 text-sm mt-1">{profil.societe}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-green-800 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-900"
            >
              Deconnexion
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <Link href={item.href} key={item.href}>
              <div className={`${item.color} text-white rounded-2xl p-5 shadow-sm active:opacity-80 cursor-pointer`}>
                <div className="text-3xl mb-3">{item.icon}</div>
                <p className="font-bold text-lg">{item.label}</p>
                <p className="text-white/70 text-xs mt-1">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {profil.depots?.nom && (
          <div className="bg-white rounded-2xl p-4 mt-4 border border-green-100 flex items-center gap-3">
            <span className="text-2xl">🏭</span>
            <div>
              <p className="text-xs text-gray-400">Mon depot de retrait</p>
              <p className="font-semibold text-gray-700">{profil.depots.nom}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
