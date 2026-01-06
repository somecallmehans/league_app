import { useForm, FormProvider } from "react-hook-form";
import { useParams } from "react-router-dom";
import { useGoBack, useScorecardInfo } from "../../hooks";
import { ScorecardInfoContext } from "./ScorecardCTX";

import StandardButton from "../../components/Button";
import WinnerFields from "./WinnerFields";
import PlayerFields from "./PlayerFields";
import AchievementCart from "./AchievementCart";

export default function ScorecardPage() {
  const { round_id } = useParams();
  const info = useScorecardInfo();

  const Back = useGoBack(`/${round_id}`);

  const methods = useForm();
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const handleFormSubmit = (data: any) => {
    // We also need to strip names from the POST body
    const { picker, ...clean } = data;
    console.log(clean);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto">
        <div className="bg-white border rounded-xl shadow-sm p-4 md:p-6">
          <div className="flex items-center">
            <Back />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {info.participants?.map(({ name }, idx) => (
              <span
                key={`${name}${idx}`}
                className="px-3 py-1 text-sm bg-sky-600 text-white rounded-full"
              >
                {name}
              </span>
            ))}
          </div>
          <ScorecardInfoContext.Provider value={info}>
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(handleFormSubmit)}>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <PlayerFields />
                    <WinnerFields />
                  </div>
                  <AchievementCart />
                </div>
                <div className="mt-4 bg-white/90 backdrop-blur border-t py-3 flex justify-end">
                  <StandardButton
                    title="Submit"
                    type="submit"
                    disabled={isSubmitting}
                  />
                </div>
              </form>
            </FormProvider>
          </ScorecardInfoContext.Provider>
        </div>
      </div>
    </div>
  );
}
