import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useDebounce } from '@/hooks/useDebounce';
import { studentService } from '@/services/healthService';

/** Top-bar search: finds a student and jumps to a new incident report for them. */
export default function GlobalSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const ref = useRef(null);
  const term = useDebounce(q.trim(), 300);
  useClickOutside(ref, () => setOpen(false), open);

  useEffect(() => {
    if (term.length < 2) { setResults([]); return undefined; }
    let live = true;
    studentService.list({ search: term, limit: 6 }).then((r) => live && setResults(r.data)).catch(() => live && setResults([]));
    return () => { live = false; };
  }, [term]);

  return (
    <div className="relative min-w-0 max-w-[692px] flex-1" ref={ref}>
      <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
      <input
        value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} aria-label="Search students"
        placeholder="Search" className="h-[46px] w-full rounded-full bg-field pl-14 pr-5 text-[15px] font-medium text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 lg:h-[54px] lg:text-[18px]"
      />
      {open && term.length >= 2 && (
        <div className="absolute left-0 right-0 top-14 z-30 animate-pop-in rounded-2xl bg-white p-2 shadow-pop ring-1 ring-line">
          <p className="px-3 py-1.5 text-xs font-semibold text-muted">Students</p>
          {!results.length && <p className="px-3 py-4 text-sm text-muted">No students match "{term}".</p>}
          {results.map((s) => (
            <button key={s.id} onClick={() => { setOpen(false); setQ(''); navigate(`/app/incidents?student=${s.id}`); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-mint-50">
              <Avatar name={s.name} size={32} />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{s.name}</span><span className="block text-xs text-muted">{s.className} · #{s.admissionNo}</span></span>
              <span className="text-xs font-semibold text-brand">Report</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
