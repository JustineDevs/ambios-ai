export default function PrivacyPage() {
  return (
    <section className="mx-auto min-h-screen w-full max-w-3xl space-y-8 px-6 py-16">
      <div>
        <p className="text-muted-foreground text-sm">AmbiOS AI</p>
        <h1 className="font-semibold text-4xl">Privacy Policy</h1>
      </div>
      <p className="text-muted-foreground">
        This MVP policy explains the information AmbiOS uses to provide workspace, agent, and
        integration features.
      </p>
      <section className="space-y-4 text-sm leading-7">
        <h2 className="font-medium text-xl">Information we use</h2>
        <p>
          We use your Google identity, workspace membership, activity records, and integration
          metadata to authenticate you and operate your workspace.
        </p>
        <h2 className="font-medium text-xl">Credentials</h2>
        <p>
          Provider credentials are handled by the integration provider. AmbiOS stores connection
          metadata needed to associate a connection with your organization and never displays
          provider secrets in the product.
        </p>
        <h2 className="font-medium text-xl">Your choices</h2>
        <p>
          You can disconnect supported integrations and request workspace data questions through
          your support channel.
        </p>
      </section>
    </section>
  );
}
