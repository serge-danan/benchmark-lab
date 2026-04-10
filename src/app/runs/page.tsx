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

type RunsPageProps = {
  searchParams: Promise<{
    model?: string;
    lang?: string;
    task?: string;
  }>;
};

function formatMicroEuro(value: number | null) {
  if (value === null) return "-";
  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatMs(value: number | null) {
  if (value === null) return "-";
  return new Intl.NumberFormat("fr-FR").format(value);
}

function buildRunsUrl(filters: {
  model?: string;
  lang?: string;
  task?: string;
}) {
  const params = new URLSearchParams();

  if (filters.model) params.set("model", filters.model);
  if (filters.lang) params.set("lang", filters.lang);
  if (filters.task) params.set("task", filters.task);

  const query = params.toString();
  return query ? `/runs?${query}` : "/runs";
}

export default async function RunsPage({ searchParams }: RunsPageProps) {
  const params = await searchParams;

  const selectedModel = params.model ?? "";
  const selectedLang = params.lang ?? "";
  const selectedTask = params.task ?? "";

  const supabase = createSupabaseServerClient();

  let query = supabase
    .from("benchmark_runs")
    .select("*")
    .order("accuracy", { ascending: false });

  if (selectedModel) {
    query = query.eq("model_name", selectedModel);
  }

  if (selectedLang) {
    query = query.eq("language_code", selectedLang);
  }

  if (selectedTask) {
    query = query.eq("task_code", selectedTask);
  }

  const { data, error } = await query;

  const { data: allRunsData } = await supabase
    .from("benchmark_runs")
    .select("model_name, language_code, task_code");

  const runs = (data ?? []) as BenchmarkRun[];
  const allRuns = allRunsData ?? [];

  const modelOptions = [
    ...new Set(allRuns.map((run) => run.model_name)),
  ].sort();
  const langOptions = [
    ...new Set(allRuns.map((run) => run.language_code)),
  ].sort();
  const taskOptions = [...new Set(allRuns.map((run) => run.task_code))].sort();

  if (error) {
    return (
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold tracking-tight">Benchmark Runs</h1>
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            Erreur lors du chargement des runs : {error.message}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Benchmark Explorer
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Benchmark Runs
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">
              Vue d’ensemble des exécutions disponibles du benchmark EmoBench.
            </p>
          </div>

          <div>
            <Link
              href="/"
              className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Retour à l’accueil
            </Link>
          </div>
        </div>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Nombre de runs</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {runs.length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Meilleure accuracy</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {runs.length > 0
                ? `${Math.max(...runs.map((run) => run.accuracy * 100)).toFixed(1)}%`
                : "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Benchmark</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {runs[0]?.benchmark_name ?? "-"}
            </p>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
            <p className="mt-1 text-sm text-gray-500">
              Les filtres sont portés par l’URL pour rendre la page partageable.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Model</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildRunsUrl({
                    lang: selectedLang,
                    task: selectedTask,
                  })}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    !selectedModel
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Tous
                </Link>
                {modelOptions.map((model) => (
                  <Link
                    key={model}
                    href={buildRunsUrl({
                      model,
                      lang: selectedLang,
                      task: selectedTask,
                    })}
                    className={`rounded-full px-3 py-1.5 text-sm ${
                      selectedModel === model
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {model}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Lang</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildRunsUrl({
                    model: selectedModel,
                    task: selectedTask,
                  })}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    !selectedLang
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Toutes
                </Link>
                {langOptions.map((lang) => (
                  <Link
                    key={lang}
                    href={buildRunsUrl({
                      model: selectedModel,
                      lang,
                      task: selectedTask,
                    })}
                    className={`rounded-full px-3 py-1.5 text-sm ${
                      selectedLang === lang
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {lang}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Task</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildRunsUrl({
                    model: selectedModel,
                    lang: selectedLang,
                  })}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    !selectedTask
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Toutes
                </Link>
                {taskOptions.map((task) => (
                  <Link
                    key={task}
                    href={buildRunsUrl({
                      model: selectedModel,
                      lang: selectedLang,
                      task,
                    })}
                    className={`rounded-full px-3 py-1.5 text-sm ${
                      selectedTask === task
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {task}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-end">
              <Link
                href="/runs"
                className="inline-flex rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Réinitialiser les filtres
              </Link>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Runs disponibles
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Triés par accuracy décroissante.
            </p>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-3 font-semibold">Run</th>
                  <th className="px-5 py-3 font-semibold">Model</th>
                  <th className="px-5 py-3 font-semibold">Task</th>
                  <th className="px-5 py-3 font-semibold">Lang</th>
                  <th className="px-5 py-3 font-semibold">Accuracy</th>
                  <th className="px-5 py-3 font-semibold">Questions</th>
                  <th className="px-5 py-3 font-semibold">Avg time</th>
                  <th className="px-5 py-3 font-semibold">Cost</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-t border-gray-100">
                    <td className="px-5 py-4 font-medium text-gray-900">
                      <Link
                        href={`/runs/${run.id}`}
                        className="transition hover:text-blue-600 hover:underline"
                      >
                        {run.run_name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {run.model_name}
                    </td>
                    <td className="px-5 py-4 text-gray-700">{run.task_code}</td>
                    <td className="px-5 py-4 text-gray-700">
                      {run.language_code}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-800">
                        {(run.accuracy * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {run.question_count}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {formatMs(run.avg_response_time_ms)} ms
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {formatMicroEuro(run.estimated_total_cost_eur_micro)} µ€
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 p-4 md:hidden">
            {runs.map((run) => (
              <article
                key={run.id}
                className="rounded-2xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-gray-900">
                    <Link
                      href={`/runs/${run.id}`}
                      className="transition hover:text-blue-600 hover:underline"
                    >
                      {run.run_name}
                    </Link>
                  </h3>
                  <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-sm font-medium text-gray-800">
                    {(run.accuracy * 100).toFixed(1)}%
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Model</dt>
                    <dd className="font-medium text-gray-900">
                      {run.model_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Task</dt>
                    <dd className="font-medium text-gray-900">
                      {run.task_code}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Lang</dt>
                    <dd className="font-medium text-gray-900">
                      {run.language_code}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Questions</dt>
                    <dd className="font-medium text-gray-900">
                      {run.question_count}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Avg time</dt>
                    <dd className="font-medium text-gray-900">
                      {formatMs(run.avg_response_time_ms)} ms
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Cost</dt>
                    <dd className="font-medium text-gray-900">
                      {formatMicroEuro(run.estimated_total_cost_eur_micro)} µ€
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          {runs.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-gray-500">
              Aucun run ne correspond aux filtres actuels.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
