"use client";

import { useId, useState, useTransition } from "react";
import { savePrefs } from "@/app/actions";
import {
  FORMAT_OPTIONS,
  GROUP_OPTIONS,
  LAYOUT_OPTIONS,
  type Prefs,
  type ShowtimeLayout,
} from "@/lib/prefs";
import { FORMAT_LABELS, type Format, type TheaterGroup } from "@/lib/types";
import { cn } from "@/lib/utils";
import { sticker } from "./sticker-card";
import { Switch } from "./switch";

/**
 * Theater groups, showtime layout, seats and formats. Every change saves to
 * the ct_prefs cookie right away, and the page re-renders with the new filters.
 * "page" is the mobile Preferences screen; "panel" is the desktop header panel.
 */
export function PreferencesForm({
  initialPrefs,
  variant,
}: {
  initialPrefs: Prefs;
  variant: "page" | "panel";
}) {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [, startTransition] = useTransition();
  const id = useId();

  function update(patch: Partial<Prefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    startTransition(async () => {
      await savePrefs(next);
    });
  }

  function setGroup(group: TheaterGroup, on: boolean) {
    update({
      groups: on
        ? [...prefs.groups, group]
        : prefs.groups.filter((g) => g !== group),
    });
  }

  function toggleFormat(format: Format) {
    update({
      formats: prefs.formats.includes(format)
        ? prefs.formats.filter((f) => f !== format)
        : [...prefs.formats, format],
    });
  }

  const layoutPicker = (className: string) => (
    <LayoutPicker
      value={prefs.layout}
      onChange={(layout) => update({ layout })}
      labelledBy={`${id}-layout`}
      className={className}
    />
  );
  const formatChips = (
    <FormatChips
      selected={prefs.formats}
      onToggle={toggleFormat}
      labelledBy={`${id}-formats`}
    />
  );

  if (variant === "panel") {
    const label = "mb-2 text-[13px] font-bold";
    const box = "rounded-xl border-2 border-ink";
    return (
      <div>
        <h3 id={`${id}-groups`} className={cn(label, "mt-3")}>
          Theater groups
        </h3>
        <ul
          aria-labelledby={`${id}-groups`}
          className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2"
        >
          {GROUP_OPTIONS.map((g) => (
            <SettingRow
              key={g.id}
              compact
              name={g.name}
              description={g.shortDescription}
              checked={prefs.groups.includes(g.id)}
              onCheckedChange={(on) => setGroup(g.id, on)}
              className={box}
            />
          ))}
        </ul>
        <div className="mt-3.5 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          <div>
            <h3 id={`${id}-layout`} className={label}>
              Showtime layout
            </h3>
            {layoutPicker("rounded-[14px] border-2 border-ink")}
          </div>
          <div>
            <h3 className={label}>Seats</h3>
            <SettingRow
              as="div"
              compact
              name="Hide accessible-only showings"
              checked={prefs.hideAccessibleOnly}
              onCheckedChange={(on) => update({ hideAccessibleOnly: on })}
              className={box}
            />
          </div>
          <div>
            <h3 id={`${id}-formats`} className={label}>
              Formats
            </h3>
            {formatChips}
          </div>
        </div>
      </div>
    );
  }

  const heading = "mt-[18px] mb-2 font-display text-[19px]";
  return (
    <div className="pb-6">
      <h2 id={`${id}-groups`} className={heading}>
        Theater groups
      </h2>
      <ul aria-labelledby={`${id}-groups`} className={sticker}>
        {GROUP_OPTIONS.map((g) => (
          <SettingRow
            key={g.id}
            name={g.name}
            description={g.description}
            checked={prefs.groups.includes(g.id)}
            onCheckedChange={(on) => setGroup(g.id, on)}
            className="border-b-2 border-dashed border-line last:border-b-0"
          />
        ))}
      </ul>

      <h2 id={`${id}-layout`} className={heading}>
        Showtime layout
      </h2>
      {layoutPicker(cn(sticker, "rounded-[14px]"))}

      <h2 className={heading}>Seats</h2>
      <div className={sticker}>
        <SettingRow
          as="div"
          name="Hide accessible-only showings"
          description="When only wheelchair and companion seats are left"
          checked={prefs.hideAccessibleOnly}
          onCheckedChange={(on) => update({ hideAccessibleOnly: on })}
        />
      </div>

      <h2 id={`${id}-formats`} className={heading}>
        Formats
      </h2>
      {formatChips}
    </div>
  );
}

function SettingRow({
  as: Tag = "li",
  name,
  description,
  checked,
  onCheckedChange,
  compact = false,
  className,
}: {
  as?: "li" | "div";
  name: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  compact?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <Tag
      className={cn(
        "flex min-h-11 items-center justify-between gap-3 px-3 py-2.5",
        className,
      )}
    >
      <div className="min-w-0">
        <div
          id={`${id}-name`}
          className={cn("font-bold", compact ? "text-sm" : "text-[15px]")}
        >
          {name}
        </div>
        {description && (
          <div id={`${id}-desc`} className="text-xs text-muted">
            {description}
          </div>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-labelledby={`${id}-name`}
        aria-describedby={description ? `${id}-desc` : undefined}
      />
    </Tag>
  );
}

function LayoutPicker({
  value,
  onChange,
  labelledBy,
  className,
}: {
  value: ShowtimeLayout;
  onChange: (layout: ShowtimeLayout) => void;
  labelledBy: string;
  className?: string;
}) {
  const name = useId();
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className={cn("flex gap-[3px] p-[3px]", className)}
    >
      {LAYOUT_OPTIONS.map((option) => (
        <label
          key={option.id}
          className="flex h-9 flex-1 cursor-pointer items-center justify-center rounded-[10px] text-xs font-bold text-muted has-checked:bg-butter has-checked:text-ink has-focus-visible:outline-[3px] has-focus-visible:outline-ink"
        >
          <input
            type="radio"
            name={name}
            value={option.id}
            checked={value === option.id}
            onChange={() => onChange(option.id)}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

function FormatChips({
  selected,
  onToggle,
  labelledBy,
}: {
  selected: Format[];
  onToggle: (format: Format) => void;
  labelledBy: string;
}) {
  return (
    <ul aria-labelledby={labelledBy} className="flex flex-wrap gap-2">
      {FORMAT_OPTIONS.map((format) => (
        <li key={format}>
          <button
            type="button"
            aria-pressed={selected.includes(format)}
            onClick={() => onToggle(format)}
            className="h-[34px] cursor-pointer rounded-[17px] border-2 border-ink bg-surface px-3 text-[13px] font-bold text-ink aria-pressed:bg-butter"
          >
            {FORMAT_LABELS[format]}
          </button>
        </li>
      ))}
    </ul>
  );
}
