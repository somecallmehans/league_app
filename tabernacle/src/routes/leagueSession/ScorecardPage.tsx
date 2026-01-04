import { useForm, FormProvider } from "react-hook-form";
import { useParams } from "react-router-dom";
import { useGoBack, useCommanderColors, useScorecardInfo } from "../../hooks";
import { ScorecardInfoContext } from "./ScorecardCTX";

import StandardButton from "../../components/Button";
import ColorGrid from "../../components/ColorGrid";
import WinnerFields from "./WinnerFields";
import PlayerFields from "./PlayerFields";
import AchievementCart from "./AchievementCart";

export default function ScorecardPage() {
  const { round_id } = useParams();
  const info = useScorecardInfo();

  const Back = useGoBack(`/${round_id}`);

  const methods = useForm();
  const { handleSubmit, watch } = methods;

  const selectedCommander = watch("winner-commander");
  const selectedPartner = watch("partner-commander");
  const { colorName } = useCommanderColors(
    selectedCommander?.colors_id,
    selectedPartner?.colors_id
  );

  const handleFormSubmit = (data: any) => {
    const { picker, ...clean } = data;
    console.log(clean);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center">
        <Back />
        <ColorGrid colors={colorName} submitted show noHover />
      </div>
      <ScorecardInfoContext.Provider value={info}>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="flex flex-col md:flex-row gap-2 mt-2">
              <div className="md:w-1/2">
                <WinnerFields />
                <PlayerFields />
              </div>
              <AchievementCart />
            </div>
            <div className="mt-2 flex justify-end">
              <StandardButton title="Submit" type="submit" />
            </div>
          </form>
        </FormProvider>
      </ScorecardInfoContext.Provider>
    </div>
  );
}
