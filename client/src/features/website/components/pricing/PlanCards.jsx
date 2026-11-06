import { Link } from "react-router-dom";
import { LuArrowRight, LuCheck } from "react-icons/lu";
import { money0 } from "../../../../utils/format.js";
import { cx } from "../../../../utils/cx.js";
import { PLAN_FEATURE_LABELS } from "../../utils/siteContent.js";
import { INTERVAL_UNIT, displayName } from "../../utils/plans.js";

function bullets(p, max) {
  const list = [
    `Up to ${p.maxStaff} staff members`,
    p.maxBranches > 1 ? `Up to ${p.maxBranches} branches` : "1 branch",
  ];
  for (const f of p.features ?? [])
    if (PLAN_FEATURE_LABELS[f]) list.push(PLAN_FEATURE_LABELS[f]);
  return list.slice(0, max);
}

/**
 * Plan cards from the server. The middle card is highlighted (wine), like the template.
 * size="compact" is used on the home page, "full" on the pricing page.
 */
export function PlanCards({ plans, size = "full" }) {
  if (plans === null)
    return (
      <div className="grid gap-5 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-80 animate-pulse rounded-2xl bg-white/70" />
        ))}
      </div>
    );
  if (!plans.length)
    return (
      <p className="text-stone-600">
        Plans are being updated.{" "}
        <Link className="font-semibold text-mauve underline" to="/contact">
          Contact us
        </Link>{" "}
        for pricing.
      </p>
    );
  const featured = plans.length >= 3 ? 1 : -1;
  return (
    <div
      className={cx(
        "grid items-stretch gap-5",
        plans.length >= 3
          ? "md:grid-cols-3"
          : plans.length === 2
            ? "mx-auto max-w-3xl md:grid-cols-2"
            : "mx-auto max-w-sm",
      )}
    >
      {plans.map((p, i) => {
        const hi = i === featured;
        return (
          <article
            key={p.id}
            className={cx(
              "relative flex flex-col rounded-2xl p-7 transition hover:-translate-y-1",
              hi
                ? "bg-gradient-to-b from-mauve to-mauve-deep text-white shadow-[0_30px_60px_-25px_rgb(91_26_48/.8)] md:-my-4 md:py-11"
                : "site-card",
            )}
          >
            {hi && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-mauve shadow">
                Recommended
              </span>
            )}
            <h3 className={cx("font-display text-2xl", !hi && "text-ink")}>
              {displayName(p)}
            </h3>
            {p.description && (
              <p
                className={cx(
                  "mt-1 text-sm",
                  hi ? "text-white/75" : "text-stone-600",
                )}
              >
                {p.description}
              </p>
            )}
            <p className="mt-5">
              <span className="num font-display text-4xl md:text-[2.6rem]">
                {money0(p.price)}
              </span>{" "}
              <span
                className={cx(
                  "text-sm",
                  hi ? "text-white/70" : "text-stone-500",
                )}
              >
                /{INTERVAL_UNIT[p.interval]}
              </span>
            </p>
            <ul className="mt-5 flex-1 space-y-2.5 text-sm">
              {bullets(p, 10).map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <LuCheck
                    size={16}
                    className={cx(
                      "mt-0.5 shrink-0",
                      hi ? "text-white" : "text-mauve",
                    )}
                  />
                  {b}
                </li>
              ))}
            </ul>
            <Link
              to={`/register?plan=${p.code}`}
              className={cx(
                "mt-7 inline-flex items-center justify-center gap-1.5 rounded-full py-3 text-sm font-semibold transition",
                hi
                  ? "bg-white text-mauve hover:bg-cream"
                  : size === "compact"
                    ? "bg-mauve text-white hover:bg-mauve-deep"
                    : "border border-mauve text-mauve hover:bg-petal",
              )}
            >
              Start free trial <LuArrowRight size={15} />
            </Link>
          </article>
        );
      })}
    </div>
  );
}
