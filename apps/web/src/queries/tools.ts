import type { Tool } from "@ambios-ai/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { hasResolvedOrgId, useOrg, useOrgOptional } from "@/app/org-context";
import { useToken } from "@/hooks/use-token";
import { queryKeys } from "./query-keys";
import { useAmbiOSClient } from "./use-client";

export function useInvalidateTools() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.tools.all(orgId) }),
    [queryClient, orgId],
  );
}

function useToolsInternal(orgId: string | undefined) {
  const createClient = useAmbiOSClient();
  const token = useToken();

  const query = useQuery<Tool[]>({
    queryKey: queryKeys.tools.list(orgId ?? ""),
    queryFn: async () => {
      const client = createClient();
      const result = await client.listWorkflows(1000, 0);
      return result.items;
    },
    enabled: hasResolvedOrgId(orgId) && !!token,
  });

  return {
    tools: query.data ?? [],
    isInitiallyLoading: query.isLoading,
    isRefreshing: query.isRefetching,
    error: query.error,
  };
}

export function useTools() {
  const { orgId } = useOrg();
  return useToolsInternal(orgId);
}

export function useToolsOptional() {
  const org = useOrgOptional();
  const result = useToolsInternal(org?.orgId);
  if (!org) {
    return null;
  }
  return result;
}

export function useUpsertTool() {
  const { orgId } = useOrg();
  const createClient = useAmbiOSClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<Tool> }) => {
      const client = createClient();
      return client.upsertWorkflow(id, input as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tools.all(orgId) });
    },
  });
}

export function useArchiveTool() {
  const { orgId } = useOrg();
  const createClient = useAmbiOSClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const client = createClient();
      return client.archiveWorkflow(id, archived);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tools.all(orgId) });
    },
  });
}

export function useRenameTool() {
  const { orgId } = useOrg();
  const createClient = useAmbiOSClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ oldId, newId }: { oldId: string; newId: string }) => {
      const client = createClient();
      return client.renameWorkflow(oldId, newId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tools.all(orgId) });
    },
  });
}

export function useToolsIncludingArchived() {
  const { orgId } = useOrg();
  const createClient = useAmbiOSClient();

  const query = useQuery<Tool[]>({
    queryKey: queryKeys.tools.listIncludingArchived(orgId),
    queryFn: async () => {
      const client = createClient();
      const result = await client.listWorkflows(1000, 0, true);
      return result.items;
    },
    enabled: hasResolvedOrgId(orgId),
  });

  return {
    tools: query.data ?? [],
    isInitiallyLoading: query.isLoading,
    isRefreshing: query.isRefetching,
    error: query.error,
  };
}
