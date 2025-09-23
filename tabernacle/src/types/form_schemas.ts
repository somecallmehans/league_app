export type SelectOption<V extends string | number = number> = {
  value?: V;
  label: string;
};

export type SelectedParticipant<V extends string | number = number> = {
  id?: V;
  name?: string;
  isNew?: boolean;
};
