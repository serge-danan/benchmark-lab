import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold">Benchmark Explorer</h1>
        <p className="mt-4 text-lg text-gray-600">
          Explorez les résultats des benchmarks LLM sur l’intelligence
          émotionnelle.
        </p>

        <div className="mt-8">
          <Link
            href="/runs"
            className="inline-flex rounded-xl bg-black px-5 py-3 text-white"
          >
            Voir les runs
          </Link>
        </div>
      </div>
    </main>
  );
}
