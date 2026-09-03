import type { ToolSchedule } from "@ambios-ai/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { hasResolvedOrgId, useOrg } from "@/app/org-context";
import { useToken } from "@/hooks/use-token";
import { queryKeys } from "./query-keys";
import { useAmbiOSClient } from "./use-client";

export function useInvalidateSchedules() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all(orgId) }),
    [queryClient, orgId],
  );
}

export function useSchedules() {
  const { orgId } = useOrg();
  const createClient = useAmbiOSClient();
  const token = useToken();

  const query = useQuery({
    queryKey: queryKeys.schedules.list(orgId),
    queryFn: async () => {
      const client = createClient();
      return client.listToolSchedules();
    },
    enabled: hasResolvedOrgId(orgId) && !!token,
  });

  const getSchedulesForTool = useCallback(
    (toolId: string): ToolSchedule[] => {
      return (query.data ?? []).filter((s) => s.toolId === toolId);
    },
    [query.data],
  );

  return {
    schedules: query.data ?? [],
    isInitiallyLoading: query.isLoading,
    isRefreshing: query.isRefetching,
    getSchedulesForTool,
    error: query.error,
  };
}
