export default function ProjetosPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-amber-700 to-orange-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-3">Projetos de Pesquisa</h1>
          <p className="text-amber-100 text-lg max-w-2xl">
            Investigações científicas em andamento e concluídas pelo laboratório.
          </p>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center text-gray-400">
        <div className="text-6xl mb-6">🚧</div>
        <p className="text-2xl font-semibold text-gray-500">Em construção...</p>
        <p className="text-gray-400 mt-2">Esta seção estará disponível em breve.</p>
      </div>
    </>
  )
}
