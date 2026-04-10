import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

type ModelSummary = {
  model_name: string;
  run_count: number;
  best_accuracy: number;
  avg_accuracy: number;
  avg_response_time_ms: number | null;
  avg_cost_micro_eur: number | null;
};

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatMs(value: number | null) {
  if (value === null) return "-";
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(value))} ms`;
}

function formatMicroEuro(value: number | null) {
  if (value === null) return "-";
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(value))} µ€`;
}

function buildModelSummaries(runs: BenchmarkRun[]): ModelSummary[] {
  const grouped = new Map<string, BenchmarkRun[]>();

  for (const run of runs) {
    const existing = grouped.get(run.model_name) ?? [];
    existing.push(run);
    grouped.set(run.model_name, existing);
  }

  const summaries: ModelSummary[] = [];

  for (const [modelName, modelRuns] of grouped.entries()) {
    const accuracies = modelRuns.map((run) => run.accuracy);
    const responseTimes = modelRuns
      .map((run) => run.avg_response_time_ms)
      .filter((value): value is number => value !== null);
    const costs = modelRuns
      .map((run) => run.estimated_total_cost_eur_micro)
      .filter((value): value is number => value !== null);

    const avgAccuracy =
      accuracies.reduce((sum, value) => sum + value, 0) / accuracies.length;

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, value) => sum + value, 0) /
          responseTimes.length
        : null;

    const avgCost =
      costs.length > 0
        ? costs.reduce((sum, value) => sum + value, 0) / costs.length
        : null;

    summaries.push({
      model_name: modelName,
      run_count: modelRuns.length,
      best_accuracy: Math.max(...accuracies),
      avg_accuracy: avgAccuracy,
      avg_response_time_ms: avgResponseTime,
      avg_cost_micro_eur: avgCost,
    });
  }

  return summaries.sort((a, b) => b.avg_accuracy - a.avg_accuracy);
}

export default async function ComparePage() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("benchmark_runs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold tracking-tight">
            Comparer les modèles
          </h1>
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            Erreur lors du chargement des données : {error.message}
          </p>
        </div>
      </main>
    );
  }

  const runs = (data ?? []) as BenchmarkRun[];
  const summaries = buildModelSummaries(runs);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Benchmark Explorer
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Comparer les modèles
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-gray-600 sm:text-base">
              Vue synthétique des performances par modèle. Cette page agrège les
              runs disponibles pour donner une première lecture comparative.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/runs"
              className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Voir les runs
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
            <p className="text-sm text-gray-500">Nombre de modèles</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {summaries.length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Meilleure accuracy moyenne</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {summaries.length > 0
                ? formatPercent(summaries[0].avg_accuracy)
                : "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Runs analysés</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {runs.length}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Synthèse comparative
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Triée par accuracy moyenne décroissante.
            </p>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-3 font-semibold">Modèle</th>
                  <th className="px-5 py-3 font-semibold">Runs</th>
                  <th className="px-5 py-3 font-semibold">Best accuracy</th>
                  <th className="px-5 py-3 font-semibold">Avg accuracy</th>
                  <th className="px-5 py-3 font-semibold">Avg time</th>
                  <th className="px-5 py-3 font-semibold">Avg cost</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((summary) => (
                  <tr
                    key={summary.model_name}
                    className="border-t border-gray-100"
                  >
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {summary.model_name}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {summary.run_count}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {formatPercent(summary.best_accuracy)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-800">
                        {formatPercent(summary.avg_accuracy)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {formatMs(summary.avg_response_time_ms)}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {formatMicroEuro(summary.avg_cost_micro_eur)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 p-4 md:hidden">
            {summaries.map((summary) => (
              <article
                key={summary.model_name}
                className="rounded-2xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-gray-900">
                    {summary.model_name}
                  </h3>
                  <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-sm font-medium text-gray-800">
                    {formatPercent(summary.avg_accuracy)}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Runs</dt>
                    <dd className="font-medium text-gray-900">
                      {summary.run_count}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Best accuracy</dt>
                    <dd className="font-medium text-gray-900">
                      {formatPercent(summary.best_accuracy)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Avg time</dt>
                    <dd className="font-medium text-gray-900">
                      {formatMs(summary.avg_response_time_ms)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Avg cost</dt>
                    <dd className="font-medium text-gray-900">
                      {formatMicroEuro(summary.avg_cost_micro_eur)}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          {summaries.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-gray-500">
              Aucun modèle disponible pour la comparaison.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
