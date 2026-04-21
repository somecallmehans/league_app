import { useFormContext, useWatch } from "react-hook-form";
import { TextInput } from "../../../components/FormInputs";
import { useLazyGetDecklistQuery } from "../../../api/apiSlice";
import { toast } from "react-toastify";

const CODE_FIELDS = [
  "winner-commander",
  "partner-commander",
  "companion-commander",
  "winner-achievements",
] as const;

function isCodeResponse(res: unknown): res is {
  "winner-commander": unknown;
  "partner-commander": unknown;
  "companion-commander": unknown;
  "winner-achievements": unknown;
} {
  return typeof res === "object" && res !== null && "winner-commander" in res;
}

export default function SubmissionToggleWithDecklist() {
  const { control, setValue, resetField, getValues } = useFormContext();
  const selectedWinner = useWatch({ control, name: "winner" }) ?? undefined;
  const [triggerDecklist] = useLazyGetDecklistQuery();

  const mode = useWatch({
    control,
    name: "submissionMode",
    defaultValue: "manual",
  });

  const setMode = (next: "manual" | "decklist") => {
    setValue("submissionMode", next, { shouldDirty: true });

    if (next === "decklist") {
      resetField("winner-commander");
      resetField("partner-commander");
      resetField("companion-commander");
      resetField("winner-achievements");
    } else {
      resetField("decklist-code");
    }
  };

  const onBlur = async () => {
    const code: string | undefined = getValues("decklist-code")
      ?.trim()
      .toUpperCase();
    if (!code) return;

    try {
      const res = await triggerDecklist({
        code,
        participant_id: undefined,
        round_id: undefined,
      }).unwrap();

      if (isCodeResponse(res)) {
        CODE_FIELDS.forEach((field) => {
          setValue(field, res[field]);
        });
        const curr = getValues("submit-to-discord") ?? [];

        if (
          selectedWinner &&
          !curr.some((x: { id: number }) => x.id === selectedWinner.id)
        ) {
          setValue("submit-to-discord", [...curr, selectedWinner]);
        }
      }
    } catch {
      toast.error("Invalid code provided");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={[
            "px-3 py-1 rounded-full text-sm border",
            mode === "manual"
              ? "bg-zinc-900 text-white"
              : "bg-white text-zinc-700",
          ].join(" ")}
        >
          Manual
        </button>
        <button
          type="button"
          onClick={() => setMode("decklist")}
          className={[
            "px-3 py-1 rounded-full text-sm border",
            mode === "decklist"
              ? "bg-zinc-900 text-white"
              : "bg-white text-zinc-700",
          ].join(" ")}
        >
          Decklist
        </button>
      </div>
      {mode === "decklist" && (
        <>
          <span className="text-xs block">
            Note: If you select a winner before adding the decklist code, it
            will automatically apply &quot;use a decklist that has been
            shared&quot; points.
          </span>
          <div className="space-y-2">
            <div className="text-sm font-medium text-zinc-700">
              Decklist Code
            </div>
            <TextInput
              name="decklist-code"
              control={control}
              type="text"
              placeholder="Add 4 Letter Code (i.e. w/o DL-)"
              classes="text-lg w-full border rounded-lg p-2"
              onBlur={onBlur}
            />
          </div>
        </>
      )}
    </div>
  );
}
