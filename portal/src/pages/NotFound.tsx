import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
            <div className="text-center max-w-md mx-auto">
                <h1 className="text-9xl font-bold text-slate-200 mb-4">404</h1>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h2>
                <p className="text-slate-600 mb-8">
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/dashboard">
                        <Button className="w-full sm:w-auto">
                            <Home className="w-4 h-4 mr-2" />
                            Go to Dashboard
                        </Button>
                    </Link>
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={() => window.history.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    );
}
