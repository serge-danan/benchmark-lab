import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RunDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type BenchmarkRun = {
  id: string;
  run_name: string;
  benchmark_name: string;
  model_name: string;
  task_code: string;
  language_code: string;
  question_count: number;
  correct_count: number;
  accuracy: number;
  avg_response_time_ms: number | null;
  estimated_total_cost_eur_micro: number | null;
  created_at: string;
};

function formatMicroEuro(value: number | null) {
  if (value === null) return "-";
  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatMs(value: number | null) {
  if (value === null) return "-";
  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function RunDetailPage({ params }: RunDetailPageProps) {
  const { id } = await params;

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("benchmark_runs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    notFound();
  }

  const run = data as BenchmarkRun;

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Benchmark Explorer
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {run.run_name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">
              Détail d’un run du benchmark EmoBench.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/runs"
              className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Retour aux runs
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Accueil
            </Link>
          </div>
        </div>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Accuracy</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {(run.accuracy * 100).toFixed(1)}%
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Bonnes réponses</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {run.correct_count} / {run.question_count}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Temps moyen</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {formatMs(run.avg_response_time_ms)} ms
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Informations du run
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Métadonnées principales du benchmark.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 px-5 py-5 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Nom du run</p>
              <p className="mt-1 font-medium text-gray-900">{run.run_name}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Benchmark</p>
              <p className="mt-1 font-medium text-gray-900">
                {run.benchmark_name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Modèle</p>
              <p className="mt-1 font-medium text-gray-900">{run.model_name}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Task</p>
              <p className="mt-1 font-medium text-gray-900">{run.task_code}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Langue</p>
              <p className="mt-1 font-medium text-gray-900">
                {run.language_code}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Questions</p>
              <p className="mt-1 font-medium text-gray-900">
                {run.question_count}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Bonnes réponses</p>
              <p className="mt-1 font-medium text-gray-900">
                {run.correct_count}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Coût total estimé</p>
              <p className="mt-1 font-medium text-gray-900">
                {formatMicroEuro(run.estimated_total_cost_eur_micro)} µ€
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Créé le</p>
              <p className="mt-1 font-medium text-gray-900">
                {formatDate(run.created_at)}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
