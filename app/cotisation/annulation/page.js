'use client'

import Link from 'next/link'

export default function CotisationAnnulation() {
  return (
    <main className="min-h-screen bg-green-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm p-10 text-center max-w-md border border-red-100">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Paiement annule</h1>
        <p className="text-gray-500 mb-6">Votre paiement a ete annule. Vous pouvez reessayer quand vous voulez.</p>
        <Link href="/cotisation">
          <button className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800">
            Reessayer
          </button>
        </Link>
      </div>
    </main>
  )
}
