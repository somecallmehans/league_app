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
      <div className="py-12 px-4 sm:px-8 md:px-16 lg:px-32 xl:px-64 text-center text-lg sm:text-xl">
        <p className="mb-4">
          Pressing the below will kick off a request to Scryfall to check if
          there are any new Commanders that need to be added to the DB.
        </p>
        <p className="mb-4">
          Scryfall offers their information free to everyone. As a show of{" "}
          <span className="font-medium">Good Citizenship</span> please use this
          feature sparingly and{" "}
          <span className="text-sky-500 underline">
            only when a new set is released
          </span>
          .
        </p>
        <div className="flex justify-center">
          <StandardButton
            title="Request New"
            action={() => setOpen(true)}
            disabled={isLocked}
          />
        </div>
        {isLocked && (
          <div className="mt-4 flex justify-center">
            <LoadingSpinner />
          </div>
        )}
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
