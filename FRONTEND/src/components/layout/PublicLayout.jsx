import { Link, Outlet, useLocation } from 'react-router-dom';
import { BrandLogo } from '@/components/brand/Brand';
import Button from '@/components/ui/Button';

/** Landing / sign-in shell: a white pill navigation floating over the mint gradient. */
export default function PublicLayout() {
  const { pathname } = useLocation();
  const isLanding = pathname === '/';
  return (
    <div className="bg-page min-h-screen px-3 pb-10 pt-4 sm:px-[4vw] sm:pt-8">
      <header className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between rounded-full bg-white pl-5 pr-3 shadow-nav sm:pl-10">
        <Link to="/" aria-label="Serene EduHealth home"><BrandLogo className="h-11" /></Link>
        <nav className="flex items-center gap-1 sm:gap-4" aria-label="Site">
          {isLanding && (
            <>
              <a href="#about" className="hidden rounded-full px-4 py-2 text-[17px] font-medium text-muted hover:text-ink sm:block">About</a>
              <a href="#resources" className="hidden rounded-full px-4 py-2 text-[17px] font-medium text-muted hover:text-ink sm:block">Resources</a>
              <Link to="/login" className="rounded-full px-4 py-2 text-[17px] font-medium text-muted hover:text-ink">Sign in</Link>
            </>
          )}
          {pathname === '/login' ? <Link to="/signup"><Button variant="dark" size="lg">Sign up</Button></Link>
            : isLanding ? <Link to="/signup"><Button variant="dark" size="lg">Get on board</Button></Link>
            : <Link to="/login"><Button variant="dark" size="lg">Sign in</Button></Link>}
        </nav>
      </header>
      <main className="mx-auto mt-5 max-w-[1440px]"><Outlet /></main>
    </div>
  );
}
