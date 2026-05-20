import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-green-50">
      <h1 className="text-4xl font-bold text-green-800 mb-4">
        🌾 Groupement d'Achat Agricole
      </h1>
      <p className="text-gray-600 text-lg mb-8">
        Bienvenue sur la plateforme de commandes groupées
      </p>
      <Link href="/login">
        <button className="bg-green-700 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-800">
          Se connecter
        </button>
      </Link>
    </main>
  )
}