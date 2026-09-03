export type Incident = {
  id: string;
  title: string;
  service: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved";
  context: string;
};

export type Action = {
  id: string;
  incidentId: string;
  agent: string;
  status: "proposed" | "approved" | "completed";
  summary: string;
  createdAt: string;
};

export type DocProposal = {
  id: string;
  incidentId: string;
  title: string;
  status: "proposal";
  body: string;
};

type Store = {
  organization: { id: string; name: string };
  agent: { id: string; name: string; status: "active" };
  incidents: Incident[];
  actions: Action[];
  docs: DocProposal[];
};

const initialStore: Store = {
  organization: { id: "org_ambios", name: "AmbiOS workspace" },
  agent: { id: "agent_ops", name: "Ops Copilot", status: "active" },
  incidents: [
    {
      id: "inc_checkout_latency",
      title: "Checkout latency spike",
      service: "checkout-api",
      severity: "high",
      status: "investigating",
      context: "p95 latency increased after the latest release; rollback is available.",
    },
  ],
  actions: [],
  docs: [],
};

const globalStore = globalThis as typeof globalThis & { __ambiosStore?: Store };

export function getStore(): Store {
  globalStore.__ambiosStore ??= structuredClone(initialStore);
  return globalStore.__ambiosStore;
}

export function runHotfix(incidentId: string, instruction = "Prepare a safe rollback plan") {
  const store = getStore();
  const incident = store.incidents.find((item) => item.id === incidentId);
  if (!incident) return { error: "Incident not found" } as const;

  const now = new Date().toISOString();
  const action: Action = {
    id: crypto.randomUUID(),
    incidentId,
    agent: store.agent.name,
    status: "completed",
    summary: instruction,
    createdAt: now,
  };
  const doc: DocProposal = {
    id: crypto.randomUUID(),
    incidentId,
    title: `Runbook proposal: ${incident.title}`,
    status: "proposal",
    body: `Observed ${incident.service} incident. Proposed action: ${instruction}. Review before publishing.`,
  };
  store.actions.unshift(action);
  store.docs.unshift(doc);
  return { incident, action, doc } as const;
}
