"use client";

import type { TAppIconComponent } from "@/components/ui/app-icon";
import { Icons } from "@/lib/frontend/icons/app-icons";

import { useTranslation } from "react-i18next";

import { GoogleBrandMark } from "@/components/auth/google-brand-mark";
import { Heading } from "@/components/heading";
import { GoogleIntegrationLogo } from "@/components/integrations/google-integration-logo";
import { WordpressIntegrationLogo } from "@/components/integrations/wordpress-integration-logo";
import { AppLogo } from "@/components/layout/app-logo";
import { Paragraph } from "@/components/paragraph";
import {
  authHeroAccentClass,
  authHeroCopyClass,
  authHeroFeatureCardClass,
  authHeroIconWellClass,
  authHeroMutedClass,
  authHeroPanelClass,
  authHeroTrustChipClass,
} from "@/lib/frontend/layout/auth-chrome";
import { typeStackMdClass } from "@/lib/frontend/layout/dashboard-chrome";
import { cn } from "@/lib/utils";

type THeroFeatureKey = 1 | 2 | 3 | 4;

type THeroFeatureMark = "crawllex" | "wordpress" | "google-search" | "workspaces";

type THeroFeature = {
  titleKey: `heroFeature${THeroFeatureKey}Title`;
  bodyKey: `heroFeature${THeroFeatureKey}Body`;
  mark: THeroFeatureMark;
};

type TTrustItem = {
  labelKey: "trustSecure" | "trustUptime" | "trustRoles" | "trustGoogle";
  mark?: "google";
  icon?: TAppIconComponent;
};

const HERO_FEATURES: THeroFeature[] = [
  { titleKey: "heroFeature1Title", bodyKey: "heroFeature1Body", mark: "crawllex" },
  { titleKey: "heroFeature2Title", bodyKey: "heroFeature2Body", mark: "wordpress" },
  { titleKey: "heroFeature3Title", bodyKey: "heroFeature3Body", mark: "google-search" },
  { titleKey: "heroFeature4Title", bodyKey: "heroFeature4Body", mark: "workspaces" },
];

const TRUST_ITEMS: TTrustItem[] = [
  { labelKey: "trustSecure", icon: Icons.security },
  { labelKey: "trustUptime", icon: Icons.checkCircle },
  { labelKey: "trustRoles", icon: Icons.userGroup },
  { labelKey: "trustGoogle", mark: "google" },
];

function FeatureMark({ mark }: { mark: THeroFeatureMark }) {
  if (mark === "wordpress") {
    return <WordpressIntegrationLogo size={22} />;
  }

  if (mark === "google-search") {
    return (
      <span className="flex items-center -space-x-1 rtl:space-x-reverse">
        <GoogleIntegrationLogo service="gsc" size={18} />
        <GoogleIntegrationLogo service="ga4" size={18} />
      </span>
    );
  }

  if (mark === "workspaces") {
    return (
      <span className="relative inline-block size-6">
        <AppLogo variant="mark" width={15} height={15} className="absolute inset-s-0 top-0 size-3.5 opacity-80" />
        <AppLogo variant="mark" width={16} height={16} className="absolute inset-e-0 bottom-0 size-4" />
      </span>
    );
  }

  return <AppLogo variant="mark" width={22} height={22} className="size-5.5" />;
}

function FeatureCard({
  feature,
  title,
  body,
}: {
  feature: THeroFeature;
  title: string;
  body: string;
}) {
  return (
    <li className={authHeroFeatureCardClass}>
      <span className={cn(authHeroIconWellClass, "shrink-0")} aria-hidden>
        <FeatureMark mark={feature.mark} />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className={cn("type-body-strong leading-snug", authHeroCopyClass)}>
          {title}
        </p>
        <Paragraph moreSmaller className={cn("leading-snug xl:text-sm", authHeroMutedClass)}>
          {body}
        </Paragraph>
      </div>
    </li>
  );
}

function TrustMark({ item }: { item: TTrustItem }) {
  if (item.mark === "google") {
    return <GoogleBrandMark size={14} />;
  }

  const Icon = item.icon;
  if (!Icon) return null;
  return <Icon className="size-3.5 shrink-0 text-brand" aria-hidden />;
}

function SignInHeroTrustStrip() {
  const { t } = useTranslation("translation", { keyPrefix: "auth.signIn" });

  return (
    <ul className="flex w-full min-w-0 max-w-xl list-none flex-wrap justify-start gap-1.5 p-0">
      {TRUST_ITEMS.map((item) => (
        <li key={item.labelKey} className={authHeroTrustChipClass}>
          <TrustMark item={item} />
          <span className={cn("whitespace-nowrap type-caption leading-snug", authHeroCopyClass)}>
            {t(item.labelKey)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Login/register hero. `overlay` hides copy below `lg` so the 50vh reveal panel is not clipped. */
export function SignInHeroSection({ overlay = false }: { overlay?: boolean }) {
  const { t } = useTranslation("translation", { keyPrefix: "auth.signIn" });
  const { t: tLayout } = useTranslation("translation", { keyPrefix: "layout" });

  return (
    <section
      className={cn(authHeroPanelClass, overlay && "hidden lg:flex")}
      aria-labelledby="sign-in-hero-heading"
    >
      <div
        className={cn(
          "flex w-full min-w-0 flex-col justify-center px-5 py-8 sm:px-8 sm:py-10",
          "lg:min-h-full lg:px-8 lg:py-10 lg:pb-8",
          "xl:px-10 xl:py-12 xl:pb-24 2xl:px-14",
          authHeroCopyClass,
        )}
      >
        <div className="mx-auto w-full max-w-xl">
          <AppLogo
            alt={tLayout("appName")}
            surface="onDark"
            className="mb-5 block h-auto w-48 max-w-full sm:mb-6 sm:w-56 xl:mb-8 xl:w-72"
            width={288}
            height={96}
            priority
          />

          <div className={typeStackMdClass}>
            <Heading
              id="sign-in-hero-heading"
              heroTitle
              className={cn(authHeroCopyClass, "leading-tight text-2xl! sm:text-3xl! 2xl:text-4xl!")}
            >
              {t("heroTitleStart")}{" "}
              <span className={authHeroAccentClass}>{t("heroTitleAccent")}</span>
            </Heading>
            <Paragraph smaller className={cn("max-w-lg leading-relaxed", authHeroMutedClass)}>
              {t("heroLead")}
            </Paragraph>
          </div>

          <ul className="mt-6 grid list-none grid-cols-1 gap-3 p-0 sm:mt-8 sm:gap-4 xl:mt-10 xl:gap-5">
            {HERO_FEATURES.map((feature) => (
              <FeatureCard
                key={feature.titleKey}
                feature={feature}
                title={t(feature.titleKey)}
                body={t(feature.bodyKey)}
              />
            ))}
          </ul>
        </div>
      </div>

      <div className="absolute inset-s-8 inset-e-8 bottom-8 z-10 hidden min-w-0 xl:block xl:inset-s-10 xl:inset-e-10 xl:bottom-10 2xl:inset-s-14 2xl:inset-e-14">
        <div className="mx-auto w-full max-w-xl">
          <SignInHeroTrustStrip />
        </div>
      </div>
    </section>
  );
}
