import type { AuthUser } from "@/lib/frontend/auth/types";
import type { TClientCreateFormValues } from "@/components/forms/client-create-form.types";

export type TClientFormProps = {
  authUser: AuthUser;
  isEdit?: boolean;
  clientId?: string;
  initialValues?: TClientCreateFormValues;
  initialLogoUrl?: string | null;
};

export type TUseClientFormOptions = {
  isEdit?: boolean;
  clientId?: string;
  initialValues?: TClientCreateFormValues;
  initialLogoUrl?: string | null;
};
