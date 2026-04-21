import { useState, useEffect, useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import PlayerFields from "../PlayerFields";
import WinnerFields from "../WinnerFields";
import { AchievementCart, CommanderFields } from "../AchievementCart";
import StepProgressIndicator from "./StepProgressIndicator";
import SubmissionToggleWithDecklist from "./SubmissionToggleWithDecklist";
import ScoresheetReviewStep from "./ScoresheetReviewStep";
import WizardFooter from "./WizardFooter";
import { getFieldsToTriggerBeforeLeavingContentStep } from "./stepValidation";

export default function MobileStepWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const { control, trigger, formState } = useFormContext();

  const endInDraw = useWatch({ control, name: "end-draw" });

  const contentSteps = endInDraw ? 1 : 4;
  const totalSteps = contentSteps + 1;

  useEffect(() => {
    setCurrentStep((s) => {
      if (endInDraw) {
        return 1;
      }
      return Math.min(Math.max(1, s), totalSteps);
    });
  }, [endInDraw, totalSteps]);

  const goToPreviousStep = useCallback(() => {
    setStepError(null);
    setCurrentStep((s) => Math.max(1, s - 1));
  }, []);

  const goToNextStep = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentStep >= totalSteps || isAdvancing) return;

      const fields = getFieldsToTriggerBeforeLeavingContentStep(
        currentStep,
        !!endInDraw,
      );

      setIsAdvancing(true);
      setStepError(null);
      try {
        if (fields.length > 0) {
          const ok = await trigger(fields as never, { shouldFocus: true });
          if (!ok) {
            setStepError(
              "Please fix the errors highlighted above before continuing.",
            );
            return;
          }
        }
        setCurrentStep((s) => Math.min(s + 1, totalSteps));
      } finally {
        setIsAdvancing(false);
      }
    },
    [currentStep, totalSteps, endInDraw, trigger, isAdvancing],
  );

  const onBack = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      goToPreviousStep();
    },
    [goToPreviousStep],
  );

  const showSubmit = currentStep === totalSteps;
  const isReview = showSubmit;

  const renderStepContent = () => {
    if (isReview) {
      return <ScoresheetReviewStep />;
    }

    if (endInDraw && currentStep === 1) {
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

    if (!endInDraw) {
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
    }

    return null;
  };

  const { isSubmitting } = formState;
  const nextDisabled = isAdvancing;

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0">
        <StepProgressIndicator
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      </div>

      {renderStepContent()}

      <WizardFooter
        showBack={currentStep > 1}
        showSubmit={showSubmit}
        onBack={onBack}
        onNext={goToNextStep}
        nextDisabled={nextDisabled}
        submitDisabled={isSubmitting}
        stepError={stepError}
      />
    </div>
  );
}
