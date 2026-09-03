import type { System, TunnelConnection } from "@ambios-ai/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { hasResolvedOrgId, useOrg, useOrgOptional } from "@/app/org-context";
import { useToken } from "@/hooks/use-token";
import { queryKeys } from "./query-keys";
import { useAmbiOSClient } from "./use-client";

export function useInvalidateSystems() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.systems.all(orgId) }),
    [queryClient, orgId],
  );
}

function useSystemsInternal(orgId: string | undefined) {
  const createClient = useAmbiOSClient();
  const token = useToken();

  const systemsQuery = useQuery({
    queryKey: queryKeys.systems.list(orgId ?? ""),
    queryFn: async () => {
      const client = createClient();
      const { items } = await client.listSystems(100);
      return items;
    },
    enabled: hasResolvedOrgId(orgId) && !!token,
  });

  // The canonical Worker API does not expose tunnel management yet. Keep the
  // on-premise wizard truthful and inert instead of probing the retired /v1
  // endpoint and presenting an empty response as a connected tunnel catalog.
  const tunnelsQuery = { data: [] as TunnelConnection[], isLoading: false };

  const isTunnelConnected = useCallback(
    (tunnelId: string) => (tunnelsQuery.data ?? []).some((t) => t.id === tunnelId),
    [tunnelsQuery.data],
  );

  return {
    systems: systemsQuery.data ?? [],
    loading: systemsQuery.isLoading,
    isRefreshing: systemsQuery.isRefetching,
    connectedTunnels: tunnelsQuery.data ?? [],
    isTunnelConnected,
    error: systemsQuery.error,
  };
}

export function useSystems() {
  const { orgId } = useOrg();
  return useSystemsInternal(orgId);
}

export function useSystemsOptional() {
  const org = useOrgOptional();
  const result = useSystemsInternal(org?.orgId);
  if (!org) {
    return null;
  }
  return result;
}

export function useSystem(systemId: string, options?: { environment?: "dev" | "prod" }) {
  const { orgId } = useOrg();
  const createClient = useAmbiOSClient();
  const token = useToken();
  return useQuery<System | null>({
    queryKey: [...queryKeys.systems.detail(orgId, systemId), options?.environment ?? "default"],
    queryFn: async () => {
      const client = createClient();
      return client.getSystem(systemId, options);
    },
    enabled: hasResolvedOrgId(orgId) && !!systemId && !!token,
  });
}

export function useCreateSystem() {
  const { orgId } = useOrg();
  const createClient = useAmbiOSClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, any>) => {
      const client = createClient();
      return client.createSystem(input as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systems.all(orgId) });
    },
  });
}

export function useUpdateSystem() {
  const { orgId } = useOrg();
  const createClient = useAmbiOSClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
      options,
    }: {
      id: string;
      input: Record<string, any>;
      options?: { environment?: "dev" | "prod" };
    }) => {
      const client = createClient();
      return client.updateSystem(id, input as any, options);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systems.all(orgId) });
    },
  });
}

export function useDeleteSystem() {
  const { orgId } = useOrg();
  const createClient = useAmbiOSClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      options,
    }: {
      id: string;
      options?: { environment?: "dev" | "prod" };
    }) => {
      const client = createClient();
      return client.deleteSystem(id, options);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systems.all(orgId) });
    },
  });
}
