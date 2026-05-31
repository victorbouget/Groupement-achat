import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-green-50">
      <h1 className="text-4xl font-bold text-green-800 mb-4">
        🌾 Groupement de l'Ille
      </h1>
      <p className="text-gray-600 text-lg mb-8">
        Bienvenue sur la plateforme de commandes groupées
      </p>
      <Link href="/login">
        <button className="bg-green-700 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-800 mb-4">
          Se connecter
        </button>
      </Link>
      <Link href="/qui-sommes-nous">
        <button className="bg-white text-green-700 border border-green-300 px-6 py-3 rounded-lg text-lg hover:bg-green-50">
          Qui sommes-nous ?
        </button>
      </Link>
    </main>
  )
}