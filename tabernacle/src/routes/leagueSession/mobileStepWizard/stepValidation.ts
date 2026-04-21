/** Field names to validate via react-hook-form `trigger()` before leaving a content step. */

export function getFieldsToTriggerBeforeLeavingContentStep(
  contentStep: number,
  endInDraw: boolean,
): string[] {
  if (endInDraw) {
    return [];
  }
  switch (contentStep) {
    case 1:
      return [];
    case 2:
      return ["winner"];
    case 3:
      return ["winner-commander"];
    case 4:
      return [];
    default:
      return [];
  }
}
