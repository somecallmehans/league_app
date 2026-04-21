import { useFormContext, useWatch } from "react-hook-form";

/** Match question copy in PlayerFields.tsx */
const PARTICIPATION_LABELS: { slug: string; label: string }[] = [
  { slug: "bring-snack", label: "Did anyone bring a snack to share?" },
  {
    slug: "submit-to-discord",
    label: "Did anyone use a decklist that has been shared?",
  },
  {
    slug: "lend-deck",
    label: "Did anyone lend a deck to another league participant?",
  },
  {
    slug: "knock-out",
    label: "Did anyone who did not win knock out other players?",
  },
  {
    slug: "money-pack",
    label:
      "Did anyone participate with a booster pack purchased for more than $10?",
  },
];

function namesList(
  participants: { id: number; name: string }[] | undefined,
): string {
  if (!participants?.length) return "—";
  return participants.map((p) => p.name).join(", ");
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-zinc-100 py-2 last:border-0">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="text-sm text-zinc-900 mt-0.5 whitespace-pre-wrap break-words">
        {value}
      </div>
    </div>
  );
}

export default function ScoresheetReviewStep() {
  const { control } = useFormContext();

  const endInDraw = useWatch({ control, name: "end-draw" });
  const mode = useWatch({ control, name: "submissionMode" }) ?? "manual";
  const decklistCode = useWatch({ control, name: "decklist-code" }) as
    | string
    | undefined;
  const winner = useWatch({ control, name: "winner" }) as
    | { name?: string }
    | undefined;
  const winnerCommander = useWatch({ control, name: "winner-commander" }) as
    | { name?: string }
    | null
    | undefined;
  const partnerCommander = useWatch({
    control,
    name: "partner-commander",
  }) as { name?: string } | null | undefined;
  const companionCommander = useWatch({
    control,
    name: "companion-commander",
  }) as { name?: string } | null | undefined;
  const achievements = useWatch({ control, name: "winner-achievements" }) as
    | { name?: string }[]
    | null
    | undefined;

  const bringSnack = useWatch({ control, name: "bring-snack" }) as
    | { id: number; name: string }[]
    | undefined;
  const submitToDiscord = useWatch({ control, name: "submit-to-discord" }) as
    | { id: number; name: string }[]
    | undefined;
  const lendDeck = useWatch({ control, name: "lend-deck" }) as
    | { id: number; name: string }[]
    | undefined;
  const knockOut = useWatch({ control, name: "knock-out" }) as
    | { id: number; name: string }[]
    | undefined;
  const moneyPack = useWatch({ control, name: "money-pack" }) as
    | { id: number; name: string }[]
    | undefined;

  const participationBySlug: Partial<
    Record<string, { id: number; name: string }[]>
  > = {
    "bring-snack": bringSnack,
    "submit-to-discord": submitToDiscord,
    "lend-deck": lendDeck,
    "knock-out": knockOut,
    "money-pack": moneyPack,
  };

  const participationLines = PARTICIPATION_LABELS.map(({ slug, label }) => ({
    label,
    value: namesList(participationBySlug[slug] ?? []),
  }));

  const achievementLines =
    achievements?.filter((a) => a?.name).map((a) => a.name as string) ?? [];

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 overflow-y-auto pb-4 px-1">
        <h2 className="text-lg font-semibold text-zinc-800 mb-2">
          Review & submit
        </h2>
        <p className="text-sm text-zinc-600 mb-4 shrink-0">
          Check everything below. Use <strong>Back</strong> to change a previous
          step.
        </p>
        <div
          className="min-h-0 shrink-0 h-[min(26rem,45dvh)] max-h-[min(26rem,45dvh)] rounded-lg border border-zinc-200 bg-zinc-50/80 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
          role="region"
          aria-label="Scoresheet summary"
        >
          <div className="p-3 space-y-0">
            {participationLines.map(({ label, value }) => (
              <ReviewRow key={label} label={label} value={value} />
            ))}
            <ReviewRow
              label="Game ended in a draw"
              value={endInDraw ? "Yes" : "No"}
            />

            {!endInDraw && (
              <ReviewRow label="Winner" value={winner?.name ?? "—"} />
            )}
            <ReviewRow
              label="Commander submission"
              value={mode === "decklist" ? "Decklist code" : "Manual"}
            />
            {mode === "decklist" && (
              <ReviewRow
                label="Decklist code"
                value={
                  decklistCode?.trim()
                    ? String(decklistCode).trim().toUpperCase()
                    : "—"
                }
              />
            )}
            {!endInDraw && (
              <>
                <ReviewRow
                  label="Commander"
                  value={winnerCommander?.name ?? "—"}
                />
                <ReviewRow
                  label="Partner / background"
                  value={partnerCommander?.name ?? "—"}
                />
                <ReviewRow
                  label="Companion"
                  value={companionCommander?.name ?? "—"}
                />
              </>
            )}
            {!endInDraw && (
              <ReviewRow
                label="Deckbuilding achievements"
                value={
                  achievementLines.length > 0
                    ? achievementLines.join("\n")
                    : "None added"
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
