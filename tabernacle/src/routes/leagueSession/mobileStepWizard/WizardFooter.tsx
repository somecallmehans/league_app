import StandardButton from "../../../components/Button";

type WizardFooterProps = {
  showBack: boolean;
  showSubmit: boolean;
  onBack: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onNext: (e: React.MouseEvent<HTMLButtonElement>) => void;
  nextDisabled: boolean;
  submitDisabled: boolean;
  stepError: string | null;
};

export default function WizardFooter({
  showBack,
  showSubmit,
  onBack,
  onNext,
  nextDisabled,
  submitDisabled,
  stepError,
}: WizardFooterProps) {
  return (
    <div className="shrink-0 mt-4 pt-4 border-t bg-white">
      {stepError && (
        <p
          className="text-sm text-red-600 mb-3 px-1"
          role="alert"
        >
          {stepError}
        </p>
      )}
      <div className="flex justify-between gap-3">
        {showBack && (
          <StandardButton
            key="back-btn"
            title="Back"
            type="button"
            action={onBack}
          />
        )}
        <div className="flex-1" />
        {showSubmit ? (
          <StandardButton
            key="submit-btn"
            title="Submit"
            type="submit"
            disabled={submitDisabled}
          />
        ) : (
          <StandardButton
            key="next-btn"
            title="Next"
            type="button"
            disabled={nextDisabled}
            action={onNext}
          />
        )}
      </div>
    </div>
  );
}
