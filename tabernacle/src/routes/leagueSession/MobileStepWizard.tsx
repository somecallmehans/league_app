import { useState, useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import StandardButton from "../../components/Button";
import PlayerFields from "./PlayerFields";
import WinnerFields from "./WinnerFields";
import { AchievementCart, CommanderFields } from "./AchievementCart";
import { TextInput } from "../../components/FormInputs";
import { useLazyGetDecklistQuery } from "../../api/apiSlice";
import { toast } from "react-toastify";

const CODE_FIELDS = [
  "winner-commander",
  "partner-commander",
  "companion-commander",
  "winner-achievements",
] as const;

function isCodeResponse(res: any): res is {
  "winner-commander": any;
  "partner-commander": any;
  "companion-commander": any;
  "winner-achievements": any;
} {
  return "winner-commander" in res;
}

const SubmissionToggleWithDecklist = () => {
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
          !curr.some((x: any) => x.id === selectedWinner.id)
        ) {
          setValue("submit-to-discord", [...curr, selectedWinner]);
        }
      }
    } catch (e) {
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
            will automatically apply "use a decklist that has been shared"
            points.
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
};

const ProgressIndicator = ({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) => {
  return (
    <div className="sticky top-0 z-10 bg-white pb-4 border-b mb-6 mt-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-zinc-600">
          Step {currentStep} of {totalSteps}
        </span>
      </div>
      <div className="flex justify-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
              i + 1 <= currentStep ? "bg-sky-600" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default function MobileStepWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const { control } = useFormContext();

  const endInDraw = useWatch({ control, name: "end-draw" });
  const decklistCode = useWatch({ control, name: "decklist-code" });
  const mode = useWatch({ control, name: "submissionMode" });

  const totalSteps = endInDraw ? 1 : mode === "decklist" ? 3 : 4;

  // Reset to step 1 when draw state changes
  useEffect(() => {
    if (endInDraw && currentStep > 1) {
      setCurrentStep(1);
    }
  }, [endInDraw, currentStep]);

  const goToNextStep = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const shouldShowSubmit = () => {
    if (currentStep === totalSteps || mode === "decklist") return true;
    return false;
  };

  const renderStepContent = () => {
    // Draw scenario: Single step with everything
    if (currentStep === 1 && endInDraw) {
      return (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-y-auto pb-4 px-1">
            <div className="space-y-6">
              <PlayerFields />
            </div>
          </div>
        </div>
      );
    }

    // Normal flow: 4 steps
    if (currentStep === 1) {
      return (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-y-auto pb-4 px-1">
            <div className="space-y-6">
              <PlayerFields />
            </div>
          </div>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-y-auto pb-4 px-1">
            <div className="space-y-6">
              <WinnerFields />
            </div>
          </div>
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div className="flex-1 min-h-0 flex flex-col min-h-[500px]">
          <div className="flex-1 overflow-y-auto pb-4 px-1">
            <div className="space-y-6">
              <SubmissionToggleWithDecklist />
              <CommanderFields />
            </div>
          </div>
        </div>
      );
    }

    if (currentStep === 4) {
      return (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-y-auto pb-4 px-1">
            <div className="space-y-6">
              <AchievementCart />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0">
        <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
      </div>

      {renderStepContent()}

      <div className="shrink-0 mt-4 pt-4 border-t bg-white flex justify-between gap-3">
        {currentStep > 1 && (
          <StandardButton
            key="back-btn"
            title="Back"
            type="button"
            action={(e) => {
              e.preventDefault();
              goToPreviousStep();
            }}
          />
        )}

        <div className="flex-1" />
        {shouldShowSubmit() ? (
          <StandardButton key="submit-btn" title="Submit" type="submit" />
        ) : (
          <StandardButton
            key="next-btn"
            title="Next"
            type="button"
            action={(e) => {
              e.preventDefault();
              goToNextStep(e);
            }}
          />
        )}
      </div>
    </div>
  );
}
