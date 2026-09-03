export default function TermsPage() {
  return (
    <section className="mx-auto min-h-screen w-full max-w-3xl space-y-8 px-6 py-16">
      <div>
        <p className="text-muted-foreground text-sm">AmbiOS AI</p>
        <h1 className="font-semibold text-4xl">Terms of Service</h1>
      </div>
      <p className="text-muted-foreground">
        These MVP terms describe the basic conditions for using AmbiOS AI while the service is in
        preview.
      </p>
      <section className="space-y-4 text-sm leading-7">
        <h2 className="font-medium text-xl">Responsible use</h2>
        <p>
          You are responsible for the actions approved or executed in your workspace. Review agent
          proposals before approving changes and keep credentials in the supported integration
          providers.
        </p>
        <h2 className="font-medium text-xl">Availability</h2>
        <p>
          AmbiOS AI is provided as an evolving MVP. Features, limits, and integrations may change as
          the platform matures.
        </p>
        <h2 className="font-medium text-xl">Contact</h2>
        <p>
          For questions about these terms, contact the AmbiOS team through your workspace support
          channel.
        </p>
      </section>
    </section>
  );
}
