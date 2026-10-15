'use client';

export function Tabs<T extends string>({ id, label, items, value, onChange, className = 'content-tabs' }: { id: string; label: string; items: { id: T; label: string; badge?: number }[]; value: T; onChange: (value: T) => void; className?: string }) {
  return <div className={className} role="tablist" aria-label={label}>{items.map((item, index) => <button key={item.id} id={`${id}-tab-${item.id}`} role="tab" aria-selected={value === item.id} aria-controls={`${id}-panel-${item.id}`} tabIndex={value === item.id ? 0 : -1} className={value === item.id ? 'active' : ''} onClick={() => onChange(item.id)} onKeyDown={(event) => {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!delta && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const next = items[event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + delta + items.length) % items.length].id;
    onChange(next);
    event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`#${id}-tab-${next}`)?.focus();
  }}>{item.label}{item.badge !== undefined && <span>{item.badge}</span>}</button>)}</div>;
}
