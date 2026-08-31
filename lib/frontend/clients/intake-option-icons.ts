import type { TAppIconComponent } from "@/components/ui/app-icon";
import { Icons } from "@/lib/frontend/icons/app-icons";
import type {
  TIntakeBuildType,
  TIntakeIntegration,
  TIntakeMobilePlatform,
  TIntakeWebAppType,
  TIntakeWebsiteFocus,
} from "@/lib/frontend/clients/intake-ui.constants";

export const INTAKE_BUILD_TYPE_ICONS: Record<TIntakeBuildType, TAppIconComponent> = {
  website: Icons.globe,
  mobile_application: Icons.smartphone,
  web_application: Icons.computer,
  other: Icons.more,
};

export const INTAKE_WEBSITE_FOCUS_ICONS: Record<TIntakeWebsiteFocus, TAppIconComponent> = {
  business_website: Icons.building,
  landing_page: Icons.layout,
  ecommerce: Icons.cart,
};

export const INTAKE_MOBILE_PLATFORM_ICONS: Record<TIntakeMobilePlatform, TAppIconComponent> = {
  android: Icons.android,
  ios: Icons.apple,
};

export const INTAKE_WEB_APP_TYPE_ICONS: Record<TIntakeWebAppType, TAppIconComponent> = {
  saas: Icons.package,
  cms: Icons.file,
  dashboard: Icons.dashboardSquare,
  other: Icons.more,
};

export const INTAKE_INTEGRATION_ICONS: Record<TIntakeIntegration, TAppIconComponent> = {
  payment_gateway: Icons.creditCard,
  email: Icons.mail,
  sms: Icons.message,
  ai: Icons.sparkles,
  other_api: Icons.api,
};
