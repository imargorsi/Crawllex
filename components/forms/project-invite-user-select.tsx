"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { UserAvatar } from "@/components/ui/user-avatar";
import { Spinner } from "@/components/ui/spinner";
import { useUserLookupQuery } from "@/features/users/users.api";
import type { TUserLookupItem } from "@/types/project-invite.types";
import { cn } from "@/lib/utils";

export type TInviteUserOption = TUserLookupItem;

type ProjectInviteUserSelectProps = {
  selectedUsers: TInviteUserOption[];
  excludedUserIds?: string[];
  onSelect: (user: TInviteUserOption) => void;
  onRemove: (userId: string) => void;
  isMutating?: boolean;
  disabled?: boolean;
  helpText?: string;
  /** Hide the built-in search label when the caller draws its own label. */
  hideSearchLabel?: boolean;
  /** Render the selected users below the search field instead of above it. */
  chipsBelow?: boolean;
};

export function ProjectInviteUserSelect({
  selectedUsers,
  excludedUserIds = [],
  onSelect,
  onRemove,
  isMutating = false,
  disabled = false,
  helpText,
  hideSearchLabel = false,
  chipsBelow = false,
}: ProjectInviteUserSelectProps) {
  const { t } = useTranslation("translation", { keyPrefix: "modules.projects.createForm" });
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const lookupQuery = useUserLookupQuery(debouncedSearch, {
    enabled: debouncedSearch.length >= 2 && !disabled,
  });

  const selectedIds = useMemo(
    () => new Set([...selectedUsers.map((user) => user.id), ...excludedUserIds]),
    [excludedUserIds, selectedUsers],
  );

  const options = (lookupQuery.data ?? []).filter((user) => !selectedIds.has(user.id));

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div className="space-y-5" ref={containerRef}>
      {chipsBelow ? (
        <>
                <div className="space-y-3">
          <div>
            {hideSearchLabel ? null : (
              <label className="mb-2 block type-label text-text-secondary" htmlFor={`${listId}-search`}>
                {t("inviteSearchLabel")}
              </label>
            )}
            <div className="relative">
              <Icons.search
                className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted"
                aria-hidden
              />
              <input
                id={`${listId}-search`}
                type="search"
                value={search}
                disabled={disabled}
                autoComplete="off"
                placeholder={t("inviteSearchPlaceholder")}
                aria-expanded={isOpen}
                aria-controls={listId}
                aria-autocomplete="list"
                role="combobox"
                onChange={(event) => {
                  setSearch(event.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                className={cn(
                  "h-12 w-full rounded-xl border border-border bg-bg-input pe-11 ps-11 type-body text-text-primary outline-none transition-colors placeholder:text-text-placeholder",
                  "focus-visible:border-(--accent-border) focus-visible:ring-2 focus-visible:ring-(--accent-border)/40",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
              />
              {lookupQuery.isFetching ? (
                <Spinner className="absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
              ) : null}
            </div>
          </div>
  
          {isOpen && debouncedSearch.length >= 2 ? (
            <div
              id={listId}
              role="listbox"
              className="max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-bg-input p-2 shadow-(--shadow)"
            >
              {lookupQuery.isError ? (
                <p className="px-3 py-3 type-caption text-status-rejected">{t("inviteSearchError")}</p>
              ) : options.length === 0 && !lookupQuery.isFetching ? (
                <p className="px-3 py-3 type-caption text-text-muted">{t("inviteSearchEmpty")}</p>
              ) : (
                <div className="space-y-1">
                  {options.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      role="option"
                      aria-selected={false}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors hover:bg-bg-hover"
                      onClick={() => {
                        onSelect(user);
                        setSearch("");
                        setDebouncedSearch("");
                        setIsOpen(false);
                      }}
                      disabled={isMutating}
                    >
                      <UserAvatar
                        name={user.name}
                        imageUrl={user.profileImage}
                        size="sm"
                        variant="photo"
                      />
                      <span className="type-stack-md min-w-0 flex-1">
                        <span className="block truncate type-body-strong text-text-primary">{user.name}</span>
                        <span className="block truncate type-caption text-text-muted">{user.email}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
  
                {selectedUsers.length > 0 ? (
          <ul className="flex flex-wrap gap-2.5" aria-label={t("inviteSelectedLabel")}>
            {selectedUsers.map((user) => (
              <li
                key={user.id}
                className="inline-flex max-w-full items-center gap-2.5 rounded-2xl border border-brand/45 bg-brand/15 py-2 ps-2.5 pe-3 shadow-(--shadow)"
              >
                <UserAvatar
                  name={user.name}
                  imageUrl={user.profileImage}
                  size="sm"
                  variant="photo"
                />
                <span className="min-w-0 truncate type-body text-text-primary">
                  <span className="font-semibold">{user.name}</span>
                  <span className="text-text-muted"> · {user.email}</span>
                </span>
                <button
                  type="button"
                  className="ms-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-brand/20 hover:text-text-primary disabled:opacity-50"
                  onClick={() => onRemove(user.id)}
                  disabled={disabled || isMutating}
                  aria-label={t("inviteRemoveAria", { name: user.name })}
                  title={t("inviteRemoveAria", { name: user.name })}
                >
                  <Icons.cancel className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
  
        </>
      ) : (
        <>
                {selectedUsers.length > 0 ? (
          <ul className="flex flex-wrap gap-2.5" aria-label={t("inviteSelectedLabel")}>
            {selectedUsers.map((user) => (
              <li
                key={user.id}
                className="inline-flex max-w-full items-center gap-2.5 rounded-2xl border border-brand/45 bg-brand/15 py-2 ps-2.5 pe-3 shadow-(--shadow)"
              >
                <UserAvatar
                  name={user.name}
                  imageUrl={user.profileImage}
                  size="sm"
                  variant="photo"
                />
                <span className="min-w-0 truncate type-body text-text-primary">
                  <span className="font-semibold">{user.name}</span>
                  <span className="text-text-muted"> · {user.email}</span>
                </span>
                <button
                  type="button"
                  className="ms-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-brand/20 hover:text-text-primary disabled:opacity-50"
                  onClick={() => onRemove(user.id)}
                  disabled={disabled || isMutating}
                  aria-label={t("inviteRemoveAria", { name: user.name })}
                  title={t("inviteRemoveAria", { name: user.name })}
                >
                  <Icons.cancel className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
  
                <div className="space-y-3">
          <div>
            {hideSearchLabel ? null : (
              <label className="mb-2 block type-label text-text-secondary" htmlFor={`${listId}-search`}>
                {t("inviteSearchLabel")}
              </label>
            )}
            <div className="relative">
              <Icons.search
                className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted"
                aria-hidden
              />
              <input
                id={`${listId}-search`}
                type="search"
                value={search}
                disabled={disabled}
                autoComplete="off"
                placeholder={t("inviteSearchPlaceholder")}
                aria-expanded={isOpen}
                aria-controls={listId}
                aria-autocomplete="list"
                role="combobox"
                onChange={(event) => {
                  setSearch(event.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                className={cn(
                  "h-12 w-full rounded-xl border border-border bg-bg-input pe-11 ps-11 type-body text-text-primary outline-none transition-colors placeholder:text-text-placeholder",
                  "focus-visible:border-(--accent-border) focus-visible:ring-2 focus-visible:ring-(--accent-border)/40",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
              />
              {lookupQuery.isFetching ? (
                <Spinner className="absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
              ) : null}
            </div>
          </div>
  
          {isOpen && debouncedSearch.length >= 2 ? (
            <div
              id={listId}
              role="listbox"
              className="max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-bg-input p-2 shadow-(--shadow)"
            >
              {lookupQuery.isError ? (
                <p className="px-3 py-3 type-caption text-status-rejected">{t("inviteSearchError")}</p>
              ) : options.length === 0 && !lookupQuery.isFetching ? (
                <p className="px-3 py-3 type-caption text-text-muted">{t("inviteSearchEmpty")}</p>
              ) : (
                <div className="space-y-1">
                  {options.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      role="option"
                      aria-selected={false}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors hover:bg-bg-hover"
                      onClick={() => {
                        onSelect(user);
                        setSearch("");
                        setDebouncedSearch("");
                        setIsOpen(false);
                      }}
                      disabled={isMutating}
                    >
                      <UserAvatar
                        name={user.name}
                        imageUrl={user.profileImage}
                        size="sm"
                        variant="photo"
                      />
                      <span className="type-stack-md min-w-0 flex-1">
                        <span className="block truncate type-body-strong text-text-primary">{user.name}</span>
                        <span className="block truncate type-caption text-text-muted">{user.email}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
  
        </>
      )}

      <p className="type-caption text-text-muted">{helpText ?? t("inviteHelp")}</p>
    </div>
  );
}
