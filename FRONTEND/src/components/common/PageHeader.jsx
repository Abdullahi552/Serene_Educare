/** Big green page title + grey subtitle, with optional actions on the right (matches the design). */
export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[clamp(28px,2.7vw,45px)] font-semibold leading-tight text-brand">{title}</h1>
        {subtitle && <p className="mt-1 text-[clamp(14px,1.15vw,20px)] text-slate/90">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
