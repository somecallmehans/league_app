import { useNavigate } from "react-router-dom";

import StandardButton from "../components/Button";

export default function useGoBack(fallback: string) {
  const navigation = useNavigate();

  const onBack = () => {
    const canGoBack = window.history.state?.idx > 0;
    if (canGoBack) navigation(-1);
    else navigation(fallback, { replace: true });
  };

  const BackButton = () => (
    <StandardButton action={() => onBack()} title="Back" />
  );

  return BackButton;
}
