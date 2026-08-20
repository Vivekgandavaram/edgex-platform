import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-4xl font-bold text-ink">404</h1>
      <p className="text-sm text-muted">This page doesn't exist in EdgeX.</p>
      <Link to="/"><Button className="mt-2">Back to Dashboard</Button></Link>
    </div>
  );
}
