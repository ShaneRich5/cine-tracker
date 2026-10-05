import { cn } from "@/lib/utils";
import { showtimeLabel, type TheaterCardData } from "@/lib/showtimes";
import { formatClock, formatClockLong, formatStartsIn } from "@/lib/time";
import { FORMAT_LABELS, type Showtime } from "@/lib/types";
import { sticker } from "./sticker-card";
import { TimeToken } from "./time-token";

/** One theater's showings: the next one you can make large, later ones as tokens. */
export function TheaterCard({
  card,
  now,
  isToday,
}: {
  card: TheaterCardData;
  now: Date;
  isToday: boolean;
}) {
  const { theater, next, later, earlier, hidden } = card;

  return (
    <article
      className={cn(
        sticker,
        "flex h-full flex-col gap-2 px-3.5 py-3 desktop:px-4 desktop:py-3.5",
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold">{theater.name}</h3>
        <span className="shrink-0 text-[11px] font-bold text-muted">
          {theater.chainLabel} · {theater.distanceMi} mi
        </span>
      </div>

      {next ? (
        <NextShowing
          showtime={next}
          wait={
            isToday
              ? formatStartsIn(next.startsAt.getTime() - now.getTime())
              : "First showing"
          }
        />
      ) : (
        <p className="font-display text-xl leading-tight text-muted">
          Nothing left today
        </p>
      )}

      {later.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-muted">Later:</span>
          {later.map((s) => (
            <TimeToken
              key={s.id}
              href={s.ticketUrl}
              external
              label={`${showtimeLabel(s)}, tickets (opens in a new tab)`}
            >
              {showtimeLabel(s)}
            </TimeToken>
          ))}
        </div>
      )}

      {hidden.length > 0 && (
        <p className="border-t-2 border-dashed border-line-2 pt-2 text-xs text-muted">
          {hidden.map((s) => formatClock(s.startsAt)).join(", ")} hidden: only
          wheelchair and companion seats left
        </p>
      )}

      {earlier.length > 0 && (
        <details className="border-t-2 border-dashed border-line-2 pt-2 text-xs">
          <summary className="cursor-pointer font-bold text-muted">
            Show {earlier.length} earlier{" "}
            {earlier.length === 1 ? "showing" : "showings"}
          </summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {earlier.map((s) => (
              <TimeToken key={s.id} variant="past">
                {showtimeLabel(s)}
              </TimeToken>
            ))}
          </div>
        </details>
      )}
    </article>
  );
}

function NextShowing({ showtime, wait }: { showtime: Showtime; wait: string }) {
  const format =
    FORMAT_LABELS[showtime.format] +
    (showtime.alistEligible ? " · A-List" : "");
  const content = (
    <>
      <time
        dateTime={showtime.startsAt.toISOString()}
        title={formatClockLong(showtime.startsAt)}
        className="font-display text-[34px] leading-none text-accent desktop:text-4xl"
      >
        {formatClock(showtime.startsAt)}
      </time>
      <span className="flex flex-col gap-px">
        <span className="text-[13px] font-bold">{format}</span>
        <span className="text-xs text-muted">{wait}</span>
      </span>
    </>
  );

  if (!showtime.ticketUrl) {
    return <div className="flex items-center gap-3">{content}</div>;
  }

  return (
    <a
      href={showtime.ticketUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 no-underline"
    >
      <span className="sr-only">Tickets for </span>
      {content}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
