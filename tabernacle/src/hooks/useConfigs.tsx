import { useGetAllConfigsQuery } from "../api/apiSlice";
import { getStoreSlug } from "../helpers/helpers";

export function useConfig(key: string): string {
  const storeSlug = getStoreSlug();
  const { data } = useGetAllConfigsQuery(undefined, {
    skip: !storeSlug,
  });

  return data?.byKey?.[key]?.value ?? "";
}

export default function useAllConfigs() {
  const storeSlug = getStoreSlug();
  const { data: configs, isLoading: configsLoading } = useGetAllConfigsQuery(
    undefined,
    {
      skip: !storeSlug,
    }
  );

  if (configsLoading) return null;

  return configs?.byKey;
}
