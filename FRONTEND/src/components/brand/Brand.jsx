import { useState } from 'react';
import { assetUrl } from '@/config/env';
import { cx } from '@/lib/format';

/** Simple heart + pulse mark, used until the real logo file is added to /public/brand. */
export function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M32 54C13 41 10 30 10 24a11 11 0 0 1 22-3 11 11 0 0 1 22 3c0 6-3 17-22 30Z" fill="none" stroke="#D61F1F" strokeWidth="4" strokeLinejoin="round" />
      <path d="M14 33h10l5-9 7 17 5-8h9" fill="none" stroke="#27AB4D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Image with a graceful fallback when the file hasn't been added yet. */
export function BrandImage({ src, alt = '', fallback = null, className }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return fallback;
  return <img src={src.startsWith('/brand/') ? src : assetUrl(src)} alt={alt} className={className} onError={() => setFailed(true)} loading="lazy" />;
}

/** The Serene EduHealth logo. Drop your exported logo at /public/brand/logo.png to replace the fallback. */
export function BrandLogo({ className }) {
  return (
    <BrandImage
      src="/brand/logo.png" alt="Serene EduHealth" className={cx('h-12 w-auto object-contain', className)}
      fallback={(
        <span className={cx('inline-flex items-center gap-2', className)}>
          <LogoMark className="h-10 w-10" />
          <span className="leading-none"><span className="block text-[10px] font-bold tracking-wider text-danger">SERENE</span><span className="block text-lg font-extrabold tracking-tight text-brand">EDUHEALTH</span></span>
        </span>
      )}
    />
  );
}
