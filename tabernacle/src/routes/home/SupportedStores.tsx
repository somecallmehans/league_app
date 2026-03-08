import PageTitle from "../../components/PageTitle";
import LoadingSpinner from "../../components/LoadingSpinner";
import CalloutCard from "../../components/CalloutCard";
import { useGetStoresQuery } from "../../api/apiSlice";
import { getStoreSlug } from "../../helpers/helpers";

function getStoreLeagueUrl(storeSlug: string): string | null {
  if (typeof window === "undefined") return null;

  const protocol = window.location.protocol;
  const hostname = window.location.hostname.toLowerCase();
  const parts = hostname.split(".");

  if (parts.length < 2) return null;

  // If we're already on a subdomain, strip it. If we're on apex, use hostname as-is.
  const baseDomain = parts.length >= 3 ? parts.slice(1).join(".") : hostname;
  return `${protocol}//${storeSlug}.${baseDomain}`;
}

export default function LeagueStores() {
  const { data: stores, isLoading } = useGetStoresQuery();
  const currentSlug = getStoreSlug();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gradient-to-b from-white to-slate-50">
      <PageTitle title="League Stores" />
      <div className="mb-3 w-full md:max-w-3xl">
        <CalloutCard
          tag="Info"
          title="Store links"
          tagClassName="bg-violet-600"
          items={[
            "Browse all currently supported stores and visit their home pages.",
            "If you're on a store subdomain, that store is marked with a Current Store badge.",
          ]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(stores ?? []).map((store) => {
          const isCurrent = !!currentSlug && store.slug === currentSlug;
          const storeLeagueUrl = isCurrent ? null : getStoreLeagueUrl(store.slug);
          return (
            <div
              key={store.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{store.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{store.slug}</p>
                </div>
                {isCurrent ? (
                  <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Current Store
                  </span>
                ) : null}
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <a
                  href={store.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-500"
                >
                  Visit home page
                  <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
                </a>
                {storeLeagueUrl ? (
                  <a
                    href={storeLeagueUrl}
                    className="inline-flex items-center gap-2 text-sm font-medium text-violet-700 hover:text-violet-500 sm:justify-end"
                  >
                    Visit Commander League page
                    <i className="fa-solid fa-arrow-right text-xs" />
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
