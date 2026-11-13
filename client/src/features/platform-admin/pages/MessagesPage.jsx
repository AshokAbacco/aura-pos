import { useState } from "react";
import { LuSend } from "react-icons/lu";
import { dateTime } from "../../../utils/format.js";
import { Badge, Button, ErrorNote, Skeleton } from "../../../components/ui";
import { usePlatformApi } from "../hooks/usePlatformApi.js";
import { PageTitle } from "../components/PageTitle.jsx";
import { MessageComposer } from "../components/MessageComposer.jsx";
import { MESSAGE_KINDS } from "../utils/platform.constants.js";

const QUICK = [
  ["RENEWAL", "Renewal reminder", "To salons whose plan ends soon"],
  ["NEW_PLAN", "New plan alert", "Tell salons about a new or changed plan"],
  ["ANNOUNCEMENT", "Announcement", "New feature, maintenance, holiday hours"],
];

/** Messages to salons (in their app's bell, optionally emailed): send new ones, see what was sent and read. */
export default function MessagesPage() {
  const list = usePlatformApi("/messages?pageSize=100");
  const [compose, setCompose] = useState(null);
  return (
    <>
      <PageTitle
        title="Messages to salons"
        sub="Shown in the bell of the Salora Glam app; owners can also get them by email."
      >
        <Button variant="primary" onClick={() => setCompose("CUSTOM")}>
          <LuSend aria-hidden /> New message
        </Button>
      </PageTitle>
      <div className="mb-5 grid gap-3 md:grid-cols-3">
        {QUICK.map(([k, l, sub]) => (
          <button
            key={k}
            onClick={() => setCompose(k)}
            className="rounded-xl border border-stone-200 bg-white p-4 text-left transition hover:border-rose-200 hover:shadow-sm"
          >
            <p className="font-semibold">{l}</p>
            <p className="mt-0.5 text-sm text-stone-500">{sub}</p>
          </button>
        ))}
      </div>
      <h2 className="mb-2 font-semibold">Sent</h2>
      {list.error && <ErrorNote onRetry={list.reload}>{list.error}</ErrorNote>}
      {list.loading ? (
        <Skeleton />
      ) : !list.data?.length ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          Nothing sent yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {list.data.map((m) => (
            <li
              key={m.batchId}
              className="rounded-xl border border-stone-200 bg-white p-4 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="flex flex-wrap items-center gap-2">
                  <Badge tone="blue">{MESSAGE_KINDS[m.kind] ?? m.kind}</Badge>
                  <b>{m.title}</b>
                </p>
                <p className="text-xs text-stone-500">
                  {dateTime(m.sentAt)} · by {m.by}
                </p>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-stone-600">
                {m.body}
              </p>
              <p className="mt-2 flex flex-wrap gap-4 text-xs text-stone-600">
                <span>
                  <b className="num">{m.recipients}</b> salon
                  {m.recipients === 1 ? "" : "s"}
                  {m.firstSalon ? ` (${m.firstSalon})` : ""}
                </span>
                <span>
                  <b className="num">{m.read}</b> read
                </span>
                <span>
                  <b className="num">{m.emailed}</b> emailed
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}
      {compose && (
        <MessageComposer
          kind={compose}
          onClose={() => setCompose(null)}
          onSent={list.reload}
        />
      )}
    </>
  );
}
