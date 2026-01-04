import { useGetAllColorsQuery } from "../api/apiSlice";
import { getCommanderColorId } from "../helpers/formHelpers";

export default function useCommanderColors(
  primary: number | undefined,
  secondary: number | undefined
) {
  const { data: colors } = useGetAllColorsQuery();

  if (!primary) return { colorName: undefined, colorId: -1 };

  const colorId = getCommanderColorId(colors, primary, secondary);
  const colorName = colors?.idObj[colorId]?.name?.toLowerCase();

  return { colorId, colorName };
}
