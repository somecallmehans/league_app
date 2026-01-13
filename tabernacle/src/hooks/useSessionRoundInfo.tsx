import { skipToken } from "@reduxjs/toolkit/query";
import { useParams } from "react-router-dom";
import { StubRound } from "../types/round_schemas";
import { useGetRoundsBySessionQuery } from "../api/apiSlice";

export default function useSessionRoundInfo(): StubRound | undefined {
  const params = useParams();
  const token = params?.session_id
    ? { session_id: params?.session_id }
    : skipToken;
  const { data: rounds } = useGetRoundsBySessionQuery(token);

  if (rounds && params?.round_id) {
    return rounds[params.round_id];
  } else {
    return {
      roundNumber: "-1",
      sessionDate: "",
      completed: false,
      previousRoundId: null,
    };
  }
}
