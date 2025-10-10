import { Fragment, useState } from "react";
import { toast } from "react-toastify";
import CreatableSelect from "react-select/creatable";
import {
  useGetParticipantsQuery,
  usePostPodParticipantMutation,
  useGetRoundParticipantsQuery,
  useDeletePodParticipantMutation,
} from "../../api/apiSlice";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";

interface ParticipantBase {
  id?: number;
  participant_id?: number;
  name?: string;
}

type RequiredBy<T, K extends keyof T> = T & { [P in K]-?: T[P] };
type ParticipantProps = RequiredBy<ParticipantBase, "id">;

interface ModalProps {
  isOpen: boolean;
  closeModal: () => void;
  modalProps: {
    participants: ParticipantProps[];
    roundId: number;
    podId: number;
  };
}

export default function ({
  isOpen,
  closeModal,
  modalProps: { participants = [], roundId = -1, podId = -1 },
}: ModalProps) {
  const [postPodParticipant] = usePostPodParticipantMutation();
  const [deletePodParticipant] = useDeletePodParticipantMutation();
  const [target, setTarget] = useState<ParticipantBase | null>(null);
  const { data: allParticipants, isLoading: participantsLoading } =
    useGetParticipantsQuery(undefined, { skip: !isOpen });

  const { data: roundParticipants, isLoading: roundParticipantsLoading } =
    useGetRoundParticipantsQuery(roundId, { skip: !isOpen || !roundId });

  if (participantsLoading || roundParticipantsLoading) {
    return null;
  }

  const currentIds = new Set<number>(
    (roundParticipants ?? []).map((p) => p.id)
  );
  const filteredParticipants = (allParticipants ?? [])
    .filter((p) => !currentIds.has(p.id))
    .map(({ id, name }) => ({ value: id, label: name }));

  const handleUpdate = async () => {
    try {
      const res = await postPodParticipant({
        ...target,
        round_id: roundId,
        pod_id: podId,
      }).unwrap();
      toast.success(res?.message);
    } catch (error) {
      console.error(error);
    }
    closeModal();
  };

  const handleDelete = async (pid: number) => {
    try {
      const res = await deletePodParticipant({
        participant_id: pid,
        pod_id: podId,
      }).unwrap();
      toast.success(res?.message);
    } catch (error) {
      console.error(error);
    }
    closeModal();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </TransitionChild>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as="div"
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-[90vw] max-w-2xl max-h-[90vh] transform overflow-y-auto rounded-2xl bg-white p-6 text-center shadow-xl transition-all">
              <DialogTitle as="h1" className="text-2xl font-semibold mb-2">
                Update Pod
              </DialogTitle>
              <div className="md:w-2/3 mx-auto mb-4 flex gap-2">
                <CreatableSelect
                  isClearable
                  options={filteredParticipants}
                  onChange={(o) => setTarget({ participant_id: o?.value })}
                  onCreateOption={(o) => setTarget({ name: o })}
                  placeholder="Add Participant"
                  className="grow"
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                  menuPortalTarget={
                    typeof document !== "undefined" ? document.body : null
                  }
                />
                <button
                  className="bg-sky-600 hover:bg-sky-500 p-2 rounded-lg text-sm text-white"
                  onClick={() => handleUpdate()}
                >
                  Submit
                </button>
              </div>

              {target?.name && (
                <div className="grid grid-cols-1 text-left w-2/3 gap-2 mx-auto text-sky-500 italic mb-2">
                  Creating {target?.name}
                </div>
              )}

              <div className="grid grid-cols-3 w-2/3 gap-2 mx-auto">
                {participants?.map((p) => (
                  <Fragment key={p.id}>
                    <div className="col-span-2 text-left sm:text-lg">
                      {p.name}
                    </div>
                    <i
                      onClick={() => handleDelete(p.id)}
                      className="fa-solid fa-trash text-red-500 hover:text-red-400 text-right"
                    />
                  </Fragment>
                ))}
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
