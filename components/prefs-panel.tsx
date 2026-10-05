"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Prefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";
import { PreferencesForm } from "./preferences-form";
import { sticker } from "./sticker-card";
import { Button } from "./ui/button";

const PANEL_ID = "preferences-panel";

type PanelState = {
  open: boolean;
  toggle: (trigger: HTMLElement) => void;
  close: () => void;
};

const PrefsPanelContext = createContext<PanelState | null>(null);

function usePrefsPanel(): PanelState {
  const ctx = useContext(PrefsPanelContext);
  if (!ctx)
    throw new Error("Wrap prefs panel components in PrefsPanelProvider");
  return ctx;
}

/** Desktop preferences open as a panel above the content, from the header or the movie page. */
export function PrefsPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const value = useMemo<PanelState>(
    () => ({
      open,
      toggle(trigger) {
        triggerRef.current = trigger;
        setOpen((o) => !o);
      },
      close() {
        setOpen(false);
        triggerRef.current?.focus();
      },
    }),
    [open],
  );

  return (
    <PrefsPanelContext.Provider value={value}>
      {children}
    </PrefsPanelContext.Provider>
  );
}

export function PrefsPanelToggle({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { open, toggle } = usePrefsPanel();
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={PANEL_ID}
      onClick={(e) => toggle(e.currentTarget)}
      className={className}
    >
      {children}
    </button>
  );
}

export function PrefsPanel({ prefs }: { prefs: Prefs }) {
  const { open, close } = usePrefsPanel();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (open) headingRef.current?.focus();
  }, [open]);

  return (
    <section
      id={PANEL_ID}
      aria-labelledby={`${PANEL_ID}-title`}
      hidden={!open}
      className={cn(sticker, "mb-5 p-4 max-desktop:hidden")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id={`${PANEL_ID}-title`}
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-[22px] outline-none"
        >
          Preferences
        </h2>
        <Button size="sm" onClick={close}>
          Done
        </Button>
      </div>
      <PreferencesForm initialPrefs={prefs} variant="panel" />
    </section>
  );
}
