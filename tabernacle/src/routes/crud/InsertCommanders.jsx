import React, { useState } from "react";
import { toast } from "react-toastify";

import StandardButton from "../../components/Button";
import ConfirmModal from "../../components/Modals/ConfirmModal";
import LoadingSpinner from "../../components/LoadingSpinner";
import { usePostInsertCommandersMutation } from "../../api/apiSlice";

export default function Page() {
  const [open, setOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [postInsertCommanders] = usePostInsertCommandersMutation();

  const handleRequest = async () => {
    try {
      setOpen(false);
      setIsLocked(true);
      const res = await postInsertCommanders().unwrap();
      toast.success(res.message);
      setIsLocked(false);
    } catch (err) {
      toast.error("Failed to fetch new commanders");
      console.error("Failed to fetch new commanders: ", err);
      setIsLocked(false);
    }
  };

  return (
    <React.Fragment>
      <div className="p-4 text-center text-xl">
        <p className="mb-4">
          Pressing the below will kick off a request to Scryfall to check if
          there are any new Commander&apos;s that need to be added to the DB.
        </p>
        <p className="mb-4">
          Scryfall offers their information free to everyone. As a show of Good
          Citizenship please use this feature sparingly and{" "}
          <span className="text-sky-500 underline">
            only when a new set is released
          </span>
          .
        </p>

        <StandardButton
          title="Request New"
          action={() => setOpen(true)}
          disabled={isLocked}
        />
        {isLocked && <LoadingSpinner />}
      </div>
      <ConfirmModal
        isOpen={open}
        title="Request New?"
        confirmAction={() => handleRequest()}
        closeModal={() => setOpen(!open)}
        bodyText="This process cannot be stopped once started, do you wish to continue?"
      />
    </React.Fragment>
  );
}
