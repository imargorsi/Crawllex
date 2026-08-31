import type { TClientCreateFormValues } from "@/components/forms/client-create-form.types";
import type { TClientFilePublic } from "@/types/client.types";

export type TClientFormProps = {
  isEdit?: boolean;
  clientId?: string;
  initialValues?: TClientCreateFormValues;
  initialLogoUrl?: string | null;
  initialFiles?: TClientFilePublic[];
};

export type TUseClientFormOptions = {
  isEdit?: boolean;
  clientId?: string;
  initialValues?: TClientCreateFormValues;
  initialLogoUrl?: string | null;
  initialFiles?: TClientFilePublic[];
};
