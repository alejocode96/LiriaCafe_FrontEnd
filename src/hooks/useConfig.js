import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getConfigRequest, updateConfigRequest } from '../api/config.service';

const CK = 'business-config';

export function useConfig() {
  return useQuery({
    queryKey: [CK],
    queryFn: () => getConfigRequest().then((r) => r.data),
    staleTime: 60_000,
    retry: false,
  });
}

export function useUpdateConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => updateConfigRequest(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CK] }),
  });
}
