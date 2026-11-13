export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold dark:bg-orange-950 dark:text-orange-300">
          🍿 Snack Overflow
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Never run out.
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Collaborative office pantry management for Bipolar Factory.
        </p>
      </div>
    </main>
  );
}

