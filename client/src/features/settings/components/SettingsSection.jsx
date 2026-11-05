export function SettingsSection({ id, title, description, children }) {
  return (
    <section
      id={id}
      className="scroll-mt-4 rounded-xl border border-stone-200 bg-white p-5"
    >
      <h2 className="font-semibold">{title}</h2>
      {description && (
        <p className="mt-0.5 text-sm text-stone-500">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}
