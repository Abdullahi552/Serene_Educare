import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="bg-page flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-7xl font-semibold text-brand">404</p>
      <p className="text-muted">That page doesn't exist.</p>
      <Link to="/"><Button>Go home</Button></Link>
    </div>
  );
}
