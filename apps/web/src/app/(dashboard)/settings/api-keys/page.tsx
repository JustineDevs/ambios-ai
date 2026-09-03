export default function ApiKeysPage() {
  return (
    <section className="grid gap-6">
      <div>
        <p className="text-muted-foreground text-sm">Personal access</p>
        <h1 className="font-semibold text-3xl">API keys</h1>
        <p className="mt-2 max-w-xl text-muted-foreground text-sm">
          Use personal API keys for authenticated AmbiOS API clients. Keys are shown once when
          created and are never displayed in full again.
        </p>
      </div>
      <div className="rounded-xl border p-5">
        <p className="font-medium">No API keys yet</p>
        <p className="mt-2 text-muted-foreground text-sm">
          API key issuance is unavailable until the workspace security service is configured.
        </p>
      </div>
    </section>
  );
}
