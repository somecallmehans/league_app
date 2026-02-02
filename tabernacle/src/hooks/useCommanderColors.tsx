import { useGetAllColorsQuery } from "../api/apiSlice";
import { getCommanderColorId } from "../helpers/formHelpers";

export default function useCommanderColors(
  primary: number | undefined,
  secondary: number | undefined
) {
  const { data: colors, isLoading } = useGetAllColorsQuery();

  if (!primary || isLoading)
    return { colorName: undefined, colorId: -1, colorLength: -1 };
  console.log(colors);
  const colorId = getCommanderColorId(colors, primary, secondary);
  const colorName = colors?.idObj[colorId]?.name?.toLowerCase();
  const colorSymbol = colors?.idObj[colorId]?.symbol;
  const colorLength = colorSymbol === "c" ? 0 : colorSymbol?.length;

  return { colorId, colorName, colorLength };
}
