import { assetUrl } from '@/config/env';
import { cx, initials } from '@/lib/format';

const TONES = ['bg-ok-bg text-ok-ink', 'bg-[#FEF3C7] text-[#92400E]', 'bg-[#FCE7F3] text-[#BE185D]', 'bg-danger-bg text-danger-ink', 'bg-[#E0ECFF] text-[#1D4ED8]'];
const toneFor = (s = '') => TONES[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];

export default function Avatar({ name, src, size = 36, className }) {
  const url = assetUrl(src);
  if (url) return <img src={url} alt={name || ''} style={{ width: size, height: size }} className={cx('shrink-0 rounded-full object-cover', className)} />;
  return <span style={{ width: size, height: size, fontSize: size * 0.36 }} className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', toneFor(name), className)}>{initials(name)}</span>;
}
