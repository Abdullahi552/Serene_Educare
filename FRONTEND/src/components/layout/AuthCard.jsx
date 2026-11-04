import { HeartPulse } from 'lucide-react';
import { BrandImage } from '@/components/brand/Brand';

/** Two-column card used by sign in / onboarding / password screens. Photo goes in /public/brand/login-student.jpg */
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="grid overflow-hidden rounded-[32px] bg-white shadow-shell md:min-h-[600px] md:grid-cols-[1fr_1fr] md:rounded-[48px]">
      <div className="relative hidden md:block">
        <BrandImage
          src="/brand/login-student.jpg" alt="" className="absolute inset-0 h-full w-full object-cover"
          fallback={(
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-br from-brand-light via-brand to-brand-deep p-10 text-white">
              <HeartPulse className="mb-4 h-12 w-12 opacity-90" />
              <p className="text-3xl font-semibold leading-tight">Healthy students.<br />Confident schools.</p>
              <p className="mt-2 max-w-xs text-sm text-white/80">Track, monitor and respond to student health needs in one place.</p>
            </div>
          )}
        />
      </div>
      <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-[72px]">
        <h1 className="text-[clamp(28px,3vw,40px)] font-semibold leading-[1.1] text-brand">{title}</h1>
        {subtitle && <p className="mt-3 text-[15px] text-muted">{subtitle}</p>}
        <div className="mt-7">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
      </div>
    </div>
  );
}
