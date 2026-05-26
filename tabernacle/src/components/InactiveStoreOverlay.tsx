interface InactiveStoreOverlayProps {
  storeName?: string;
}

export default function InactiveStoreOverlay({
  storeName,
}: InactiveStoreOverlayProps) {
  const label = storeName ?? "This store";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-md">
      <div className="mx-4 max-w-lg rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <i className="fa-solid fa-store-slash text-2xl text-amber-600" />
        </div>
        <h2 className="text-2xl font-semibold text-slate-800">
          Store Inactive
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {label} is no longer an active Commander League store. Historical data
          may still be visible, but new activity is not available.
        </p>
        <a
          href={`${window.location.protocol}//${window.location.hostname.split(".").slice(1).join(".")}`}
          className="mt-6 inline-block rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-sky-500 transition"
        >
          Go to Commander League home
        </a>
      </div>
    </div>
  );
}
