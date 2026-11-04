import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Download, FileText, History, Send, Trash2, User } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { BrandImage } from '@/components/brand/Brand';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { aiService } from '@/services/healthService';
import { assetUrl } from '@/config/env';
import { cx, formatBytes, formatTime, timeAgo } from '@/lib/format';

const GREETING = { id: 'greeting', role: 'assistant', content: 'Hello! I am SereneAI School Health Chatbot. How can I help you manage student health records or clarify protocols today?', createdAt: new Date().toISOString(), attachments: [] };
const QUICK = ['Check Immunization', 'Report Symptoms', 'View Policy', 'Emergency Contacts'];

function Robot({ size = 28 }) {
  return (
    <span style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-brand ring-1 ring-brand/40">
      <BrandImage src="/brand/serene-ai.png" className="h-full w-full object-cover" fallback={<Bot style={{ width: size * 0.6, height: size * 0.6 }} />} />
    </span>
  );
}

function Message({ m, userName }) {
  const mine = m.role === 'user';
  return (
    <div className={cx('flex items-end gap-3', mine && 'flex-row-reverse')}>
      {mine ? <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E53935] text-white"><User className="h-4 w-4" /></span> : <Robot />}
      <div className={cx('flex max-w-[78%] flex-col gap-1', mine && 'items-end')}>
        <p className="text-[10px] text-muted">{mine ? <><span>{formatTime(m.createdAt)}</span> <b className="ml-1 text-ink">{userName}</b></> : <><b className="mr-1 text-brand">SereneAI</b>{formatTime(m.createdAt)}</>}</p>
        <div className={cx('rounded-lg px-3.5 py-2.5 text-xs leading-relaxed shadow-sm', mine ? 'bg-brand text-white' : 'border border-line bg-white')}>
          <p className="whitespace-pre-wrap">{m.content}</p>
          {m.attachments?.map((a) => (
            <a key={a.url} href={assetUrl(a.url)} target="_blank" rel="noreferrer" className="mt-2.5 flex items-center gap-3 rounded-lg bg-field p-2.5 text-ink hover:bg-mint-100">
              <span className="flex h-8 w-8 items-center justify-center rounded bg-danger-bg text-danger"><FileText className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{a.name}</span><span className="block text-[10px] text-muted">{formatBytes(a.sizeBytes)} • {a.mimeType === 'application/pdf' ? 'PDF Document' : 'File'}</span></span>
              <Download className="h-4 w-4 text-muted" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AiChat() {
  const { user } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState([GREETING]);
  const [conversationId, setConversationId] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState(null); // null = closed
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' }); }, [messages, sending]);

  const send = useCallback(async (raw) => {
    const content = raw.trim();
    if (!content || sending) return;
    setText('');
    setMessages((m) => [...m, { id: `u${Date.now()}`, role: 'user', content, createdAt: new Date().toISOString(), attachments: [] }]);
    setSending(true);
    try {
      const res = await aiService.send(content, conversationId);
      setConversationId(res.conversationId);
      setMessages((m) => [...m, res.message]);
    } catch (e) { toast.error(e.message); } finally { setSending(false); }
  }, [conversationId, sending, toast]);

  const clear = async () => {
    if (conversationId) { try { await aiService.remove(conversationId); } catch (e) { return toast.error(e.message); } }
    setMessages([{ ...GREETING, createdAt: new Date().toISOString() }]);
    setConversationId(null);
  };

  const openHistory = async () => {
    setHistory({ loading: true, items: [] });
    try { const r = await aiService.conversations(); setHistory({ loading: false, items: r.data }); } catch (e) { setHistory(null); toast.error(e.message); }
  };
  const load = async (id) => {
    try { const c = await aiService.conversation(id); setConversationId(c.id); setMessages([GREETING, ...c.messages]); setHistory(null); } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="flex h-[calc(100vh-170px)] min-h-[520px] flex-col lg:h-[calc(100vh-205px)]">
      <header className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-4">
          <span className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full bg-white text-brand ring-4 ring-brand/80"><BrandImage src="/brand/serene-ai.png" className="h-full w-full object-cover" fallback={<Bot className="h-9 w-9" />} /></span>
          <div><h1 className="text-lg font-bold leading-tight">SereneAI</h1><p className="text-sm leading-tight text-ink/80">School Health<br />Chatbot</p></div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" icon={History} onClick={openHistory}>History</Button>
          <Button variant="danger" icon={Trash2} onClick={clear}>Clear Chat</Button>
          <span className="hidden h-10 w-px bg-line sm:block" />
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E53935] text-white" aria-hidden><User className="h-5 w-5" /></span>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto rounded-sm border-t-2 border-line bg-[#F6F7F6] p-5" aria-live="polite">
        <p className="mx-auto w-fit rounded-full bg-white px-3 py-0.5 text-[10px] text-muted shadow-sm">Today</p>
        {messages.map((m) => <Message key={m.id} m={m} userName={user.name} />)}
        {sending && <div className="flex items-end gap-3"><Robot /><span className="flex gap-1 rounded-lg border border-line bg-white px-3 py-2.5" aria-label="SereneAI is typing">{[0, 1, 2].map((i) => <i key={i} className="h-1.5 w-1.5 animate-dot rounded-full bg-muted" style={{ animationDelay: `${i * 0.2}s` }} />)}</span></div>}
        <div ref={endRef} />
      </div>

      <div className="mx-auto mt-4 w-full max-w-[760px]">
        <div className="mb-3 flex flex-wrap justify-center gap-2">{QUICK.map((q) => <button key={q} onClick={() => send(q)} disabled={sending} className="rounded-full border border-line bg-mint-50 px-3.5 py-1.5 text-[11px] font-medium text-slate transition hover:border-brand/50 hover:bg-mint-150 disabled:opacity-50">{q}</button>)}</div>
        <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex items-center gap-2 rounded-xl border border-line bg-field px-4 py-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your health query here..." aria-label="Message" className="min-w-0 flex-1 bg-transparent text-sm placeholder:text-muted focus:outline-none" />
          <button type="submit" disabled={!text.trim() || sending} aria-label="Send message" className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-white transition hover:bg-brand-dark disabled:opacity-50"><Send className="h-4 w-4" /></button>
        </form>
        <p className="mt-2 text-center text-[10px] text-muted">AI provides information based on school records. For medical emergencies, please call 911 immediately.</p>
      </div>

      {history && (
        <Modal onClose={() => setHistory(null)} title="Chat history" size="sm">
          {history.loading ? <div className="flex justify-center py-8"><Spinner /></div> : !history.items.length ? <EmptyState icon={History} title="No past conversations" /> : (
            <ul className="space-y-2">{history.items.map((c) => <li key={c.id}><button onClick={() => load(c.id)} className="flex w-full items-center justify-between gap-3 rounded-xl bg-mint-50 px-4 py-3 text-left hover:bg-mint-150"><span className="min-w-0 truncate text-sm font-medium">{c.title}</span><span className="shrink-0 text-xs text-muted">{timeAgo(c.updatedAt)}</span></button></li>)}</ul>
          )}
        </Modal>
      )}
    </div>
  );
}
