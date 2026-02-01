import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useVerifyDecklistSessionQuery,
  useGetParticipantDecklistsQuery,
} from "../../api/apiSlice";

import LoadingSpinner from "../../components/LoadingSpinner";

export default function EditDecklistsPage() {
  const navigate = useNavigate();
  const { data: decklists } = useGetParticipantDecklistsQuery();
  const {
    data: verification,
    isLoading,
    isFetching,
    isError,
  } = useVerifyDecklistSessionQuery();

  const checking = isLoading || isFetching;

  useEffect(() => {
    if (checking) return;

    console.log(isError || verification);
    if (isError || verification?.active === false) {
      navigate("/decklists/gatekeeper", { replace: true });
    }
  }, [checking, isError, verification?.active, navigate]);

  console.log(decklists);

  if (checking) {
    return <LoadingSpinner />;
  }
  return <div>ITS EDITING TIME!</div>;
}
