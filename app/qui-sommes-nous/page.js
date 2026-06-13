import Link from 'next/link'

export default function QuiSommesNous() {
  return (
    <main className="min-h-screen bg-green-50">

      {/* Header */}
      <div className="bg-white border-b border-green-100 px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-green-800">🌾 Groupement de l'Ille</h1>
        <Link href="/login">
          <button className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 text-sm">
            Se connecter
          </button>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-16">

        {/* Hero */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-green-800 mb-4">Qui sommes-nous ?</h2>
          <p className="text-xl text-gray-500">Un groupement d'agriculteurs independants, uni par des valeurs communes.</p>
        </div>

        {/* Histoire */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-green-100">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🌱</span>
            <h3 className="text-2xl font-bold text-green-800">Notre histoire</h3>
          </div>
          <p className="text-gray-600 leading-relaxed mb-4">
            Tout a commence dans les annees 90, lorsqu'un groupe d'agriculteurs partageant une meme vision a decide de prendre son destin en main. Face a la mainmise des cooperatives et des negociants sur les filieres agricoles, ces pionniers ont eu le courage de s'organiser differemment.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Leur idee etait simple mais ambitieuse : en unissant leurs forces, les agriculteurs pourraient retrouver leur independance, negocier directement avec les fournisseurs et reprendre le controle de leurs approvisionnements. Depuis plus de trente ans, le Groupement de l'Ille incarne cette vision et continue de grandir, fort de la confiance de ses adherents.
          </p>
        </div>

        {/* Valeurs */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-green-100">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🤝</span>
            <h3 className="text-2xl font-bold text-green-800">Nos valeurs</h3>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🔓</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">Independance</h4>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Notre raison d'etre. Nous croyons fermement que l'agriculteur doit rester maitre de ses choix, libre de toute pression commerciale. En achetant ensemble, nous negocions en position de force et preservons notre autonomie face aux grands acteurs de la filiere.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">⚖️</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">L'egalite des chances</h4>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Pourquoi un grand exploitant beneficierait-il de meilleurs tarifs qu'un petit ? Au sein du groupement, chaque adherent, quelle que soit la taille de son exploitation, accede aux memes conditions d'achat. En mutualisant nos volumes, nous permettons aux plus petits d'obtenir des prix jusqu'ici reserves aux plus grands. C'est la force du collectif au service de chacun.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🌾</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">La juste place de l'agriculteur</h4>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Nous portons la conviction profonde que l'agriculteur doit retrouver sa veritable place au coeur de la filiere : non pas comme simple maillon d'une chaine imposee, mais comme acteur a part entiere, respecte et valorise pour son travail et son expertise.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-green-100">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">📬</span>
            <h3 className="text-2xl font-bold text-green-800">Nous contacter</h3>
          </div>
          <p className="text-gray-500 mb-6">Une question, envie de rejoindre le groupement ? N'hesitez pas a nous contacter.</p>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="text-green-700 text-xl">📧</span>
              <span className="text-gray-600">contact@groupement-ille.fr</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-700 text-xl">📞</span>
              <span className="text-gray-600">06 00 00 00 00</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-500 mb-4">Vous etes deja membre ?</p>
          <Link href="/login">
            <button className="bg-green-700 text-white px-8 py-3 rounded-xl text-lg hover:bg-green-800">
              Acceder a mon espace
            </button>
          </Link>
        </div>

      </div>
    </main>
  )
}
