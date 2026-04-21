export default function StepProgressIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
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
}
