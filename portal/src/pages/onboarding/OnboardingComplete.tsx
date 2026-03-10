import { Link } from 'react-router-dom';
import { CheckCircle, Clock, ArrowRight, CreditCard } from 'lucide-react';
import { Button, Card } from '../../components/ui';

export function OnboardingComplete() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-900">iSwitch</span>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-success-600" />
        </div>

        <h1 className="text-3xl font-semibold text-slate-900 mb-3">
          Application submitted!
        </h1>
        <p className="text-lg text-slate-600 mb-8">
          Thank you for completing your application. We're reviewing your information and will notify you once verification is complete.
        </p>

        <Card className="text-left mb-8">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Under Review</h3>
                <p className="text-sm text-slate-500">Estimated time: 1-2 business days</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <h4 className="text-sm font-medium text-slate-900 mb-4">What happens next?</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-slate-600">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Document verification</p>
                  <p className="text-sm text-slate-500">We'll verify the documents you uploaded</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-slate-600">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Business review</p>
                  <p className="text-sm text-slate-500">Our team will review your business information</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-slate-600">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Account activation</p>
                  <p className="text-sm text-slate-500">Once approved, your account will be activated for live transactions</p>
                </div>
              </li>
            </ul>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/dashboard">
            <Button>
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Have questions? Contact our support team at{' '}
          <a href="mailto:support@iswitch.com" className="text-primary-600 hover:text-primary-700">
            support@setl.digital
          </a>
        </p>
      </div>
    </div>
  );
}
