import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCard, Building2, User, MapPin, FileText, CheckCircle,
  ArrowLeft, ArrowRight, Upload, X, Check
} from 'lucide-react';
import { Button, Input, Select, Card, useToast } from '../../components/ui';
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk';
import { onboardingMethods, authMethods } from '../../services/methods';
import { OnboardingStatus } from '../../types/models';
import { useAuth } from '../../hooks';

const steps = [
  { id: 'type', title: 'Business Type', icon: Building2 },
  { id: 'info', title: 'Business Info', icon: User },
  { id: 'address', title: 'Address', icon: MapPin },
  { id: 'documents', title: 'Documents', icon: FileText },
  { id: 'review', title: 'Review', icon: CheckCircle },
];

const industries = [
  { value: 'technology', label: 'Technology' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'saas', label: 'SaaS' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'finance', label: 'Finance' },
  { value: 'retail', label: 'Retail' },
  { value: 'other', label: 'Other' },
];

const countries = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'in', label: 'India' },
];

interface OnboardingData {
  businessType: 'Individual' | 'Company' | '';
  businessName: string;
  website: string;
  industry: string;
  description: string;
  country: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string;
  accountType: string;
  documents: { type: string; file: File | null; name: string; uploaded: boolean; label: string; desc: string }[];
}

export function Onboarding() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const { error: showError } = useToast();
  const [data, setData] = useState<OnboardingData>({
    businessType: '',
    businessName: '',
    website: '',
    industry: '',
    description: '',
    country: 'in',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking',
    documents: [
      { type: 'director_pan', file: null, name: '', uploaded: false, label: 'Director PAN Card', desc: 'PAN card of company director' },
      { type: 'director_adhar', file: null, name: '', uploaded: false, label: 'Director Aadhaar Card', desc: 'Aadhaar card of company director' },
      { type: 'company_pan', file: null, name: '', uploaded: false, label: 'Company PAN Card', desc: 'PAN card of the company' },
      { type: 'company_gst', file: null, name: '', uploaded: false, label: 'GST Certificate', desc: 'GST registration certificate' },
    ],
  });

  const [appName, setAppName] = useState('Setl');
  const [appLogo, setAppLogo] = useState<string | null>(null);

  // Hooks
  const { data: { message: settings } = {} } = useFrappeGetCall<{ message: { app_name: string; app_logo?: string } }>(authMethods.getWebsiteSettings);
  const { data: onboardingStatusData, isLoading: statusLoading, mutate: refreshStatus } = useFrappeGetCall<{ message: OnboardingStatus }>(onboardingMethods.getOnboardingStatus);

  const { call: updateBusinessType } = useFrappePostCall(onboardingMethods.updateBusinessType);
  const { call: updateBusinessInfo } = useFrappePostCall(onboardingMethods.updateBusinessInfo);
  const { call: updateAddress } = useFrappePostCall(onboardingMethods.updateAddress);
  const { call: completeOnboarding } = useFrappePostCall(onboardingMethods.completeOnboarding);

  const initialLoading = statusLoading;

  useEffect(() => {
    if (settings) {
      if (settings.app_name) setAppName(settings.app_name);
      if (settings.app_logo) setAppLogo(settings.app_logo);
    }
  }, [settings]);

  useEffect(() => {
    if (onboardingStatusData?.message) {
      const status = onboardingStatusData.message;

      // If already completed, ensure context is updated and redirect
      if (status.onboarding_completed === 1) {
        refreshUser();
        navigate('/dashboard');
        return;
      }

      // Load saved data
      setData(prev => ({
        ...prev,
        businessType: (status.data.business_type as any) || '',
        businessName: status.data.business_name || '',
        industry: status.data.industry || '',
        description: status.data.description || '',
        website: status.data.website || '',
        country: status.data.country || 'in',
        address1: status.data.address1 || '',
        address2: status.data.address2 || '',
        city: status.data.city || '',
        state: status.data.state || '',
        postalCode: status.data.postalCode || '',
        phone: status.data.phone || '',
        // Update documents with uploaded status
        documents: prev.documents.map(doc => ({
          ...doc,
          uploaded: !!status.documents?.[doc.type as keyof typeof status.documents],
          name: status.documents?.[doc.type as keyof typeof status.documents] ?
            String(status.documents[doc.type as keyof typeof status.documents]).split('/').pop() || '' : ''
        }))
      }));

      let step = status.current_step;
      if (step > 4) step = 4; // Cap at review
      setCurrentStep(step);
    }
  }, [onboardingStatusData, navigate, refreshUser]);


  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return data.businessType !== '';
      case 1:
        return !!(data.businessName && data.industry);
      case 2:
        return !!(data.address1 && data.city && data.state && data.postalCode && data.phone);
      case 3:
        return data.documents.filter(d => d.uploaded).length >= 4;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    try {
      setLoading(true);

      // Save current step data to backend
      switch (currentStep) {
        case 0:
          await updateBusinessType({ business_type: data.businessType });
          break;
        case 1:
          await updateBusinessInfo({
            business_name: data.businessName,
            industry: data.industry,
            website: data.website || '',
            description: data.description || '',
          });
          break;
        case 2:
          await updateAddress({
            country: data.country,
            address1: data.address1,
            address2: data.address2 || '',
            city: data.city,
            state: data.state,
            postal_code: data.postalCode,
            phone: data.phone,
          });
          break;
        // No case 3 update needed as documents are uploaded individually
      }

      refreshStatus(); // Refresh status to ensure backend state is synced

      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error('Failed to save step:', error);
      showError('Error', 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await completeOnboarding({});
      refreshUser(); // Update user context to reflect onboarding status
      navigate('/onboarding/complete');
    } catch (error: any) {
      console.error('Failed to complete onboarding:', error);
      showError('Error', error.message || 'Failed to complete onboarding. Please ensure all required fields are filled.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingDoc(type);

      const formData = new FormData();
      formData.append(type, file);

      // Direct fetch for file upload since hooks don't support file upload easily yet without customization
      const response = await fetch(`/api/method/${onboardingMethods.uploadDocument}`, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Frappe-CSRF-Token': (window as any).csrf_token || '',
        }
      });

      const resData = await response.json();

      if (!response.ok || (resData.message && resData.message.success === false)) {
        throw new Error(resData.message?.message || resData.exception || 'Upload failed');
      }

      // Update local state
      setData({
        ...data,
        documents: data.documents.map(d =>
          d.type === type ? { ...d, file, name: file.name, uploaded: true } : d
        ),
      });
      refreshStatus();
    } catch (error) {
      console.error('File upload failed:', error);
      showError('Error', 'File upload failed. Please try again.');
    } finally {
      setUploadingDoc(null);
    }
  };

  const removeFile = (type: string) => {
    setData({
      ...data,
      documents: data.documents.map(d =>
        d.type === type ? { ...d, file: null, name: '', uploaded: false } : d
      ),
    });
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            {appLogo ? (
              <img src={appLogo} alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
            ) : (
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
            )}
            <span className="font-semibold text-slate-900">{appName}</span>
          </Link>
          <span className="text-sm text-slate-500">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all
                      ${isCompleted ? 'bg-success-500 text-white' : ''}
                      ${isCurrent ? 'bg-slate-900 text-white' : ''}
                      ${!isCompleted && !isCurrent ? 'bg-slate-200 text-slate-500' : ''}
                    `}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`
                    mt-2 text-xs font-medium
                    ${isCurrent ? 'text-slate-900' : 'text-slate-500'}
                  `}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-12 lg:w-24 h-0.5 mx-2 mt-[-20px]
                    ${index < currentStep ? 'bg-success-500' : 'bg-slate-200'}
                  `} />
                )}
              </div>
            );
          })}
        </div>

        <Card padding="lg" className="mb-6">
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  What type of business are you?
                </h2>
                <p className="text-sm text-slate-500">
                  Select the option that best describes your business structure
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setData({ ...data, businessType: 'Individual' })}
                  className={`
                    p-6 rounded-xl border-2 text-left transition-all
                    ${data.businessType === 'Individual'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 hover:border-slate-300'
                    }
                  `}
                >
                  <User className={`w-8 h-8 mb-3 ${data.businessType === 'Individual' ? 'text-primary-600' : 'text-slate-400'}`} />
                  <h3 className="font-semibold text-slate-900 mb-1">Individual</h3>
                  <p className="text-sm text-slate-500">
                    Sole proprietor, freelancer, or self-employed
                  </p>
                </button>

                <button
                  onClick={() => setData({ ...data, businessType: 'Company' })}
                  className={`
                    p-6 rounded-xl border-2 text-left transition-all
                    ${data.businessType === 'Company'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 hover:border-slate-300'
                    }
                  `}
                >
                  <Building2 className={`w-8 h-8 mb-3 ${data.businessType === 'Company' ? 'text-primary-600' : 'text-slate-400'}`} />
                  <h3 className="font-semibold text-slate-900 mb-1">Company</h3>
                  <p className="text-sm text-slate-500">
                    LLC, Corporation, Partnership, or other legal entity
                  </p>
                </button>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  Tell us about your business
                </h2>
                <p className="text-sm text-slate-500">
                  This information helps us understand your business and verify your identity
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={data.businessType === 'Company' ? 'Legal business name' : 'Full legal name'}
                  placeholder={data.businessType === 'Company' ? 'Acme Inc.' : 'John Smith'}
                  value={data.businessName}
                  onChange={(e) => setData({ ...data, businessName: e.target.value })}
                />
                <Input
                  label="Business website"
                  placeholder="https://example.com"
                  value={data.website}
                  onChange={(e) => setData({ ...data, website: e.target.value })}
                  hint="Optional"
                />
              </div>

              <Select
                label="Industry"
                options={industries}
                value={data.industry}
                onChange={(e) => setData({ ...data, industry: e.target.value })}
                placeholder="Select your industry"
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Business description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Briefly describe what your business does..."
                  value={data.description}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  Business address
                </h2>
                <p className="text-sm text-slate-500">
                  Enter the primary address for your business operations
                </p>
              </div>

              <Select
                label="Country"
                options={countries}
                value={data.country}
                onChange={(e) => setData({ ...data, country: e.target.value })}
              />

              <Input
                label="Address line 1"
                placeholder="123 Main Street"
                value={data.address1}
                onChange={(e) => setData({ ...data, address1: e.target.value })}
              />

              <Input
                label="Address line 2"
                placeholder="Suite 100"
                value={data.address2}
                onChange={(e) => setData({ ...data, address2: e.target.value })}
                hint="Optional"
              />

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="City"
                  placeholder="San Francisco"
                  value={data.city}
                  onChange={(e) => setData({ ...data, city: e.target.value })}
                />
                <Input
                  label="State / Province"
                  placeholder="CA"
                  value={data.state}
                  onChange={(e) => setData({ ...data, state: e.target.value })}
                />
                <Input
                  label="ZIP / Postal code"
                  placeholder="94102"
                  value={data.postalCode}
                  onChange={(e) => setData({ ...data, postalCode: e.target.value })}
                />
              </div>

              <Input
                label="Phone number"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={data.phone}
                onChange={(e) => setData({ ...data, phone: e.target.value })}
              />
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  Verification documents
                </h2>
                <p className="text-sm text-slate-500">
                  Upload all 4 documents to verify your identity and business
                </p>
              </div>

              <div className="space-y-4">
                {data.documents.map((doc) => {
                  const uploaded = data.documents.find(d => d.type === doc.type);
                  const hasFile = uploaded?.uploaded;
                  const isUploading = uploadingDoc === doc.type;

                  return (
                    <div
                      key={doc.type}
                      className={`
                        p-4 rounded-lg border-2 border-dashed transition-all
                        ${hasFile ? 'border-success-300 bg-success-50' : 'border-slate-200 hover:border-slate-300'}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {hasFile ? (
                            <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-success-600" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                              <Upload className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-slate-900">{doc.label}</p>
                            {hasFile ? (
                              <p className="text-xs text-success-600">{uploaded?.name}</p>
                            ) : (
                              <p className="text-xs text-slate-500">{doc.desc}</p>
                            )}
                          </div>
                        </div>
                        {isUploading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                        ) : hasFile ? (
                          <button
                            onClick={() => removeFile(doc.type)}
                            className="p-2 text-slate-400 hover:text-error-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        ) : (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileUpload(doc.type, e)}
                            />
                            <span className="text-sm font-medium text-primary-600 hover:text-primary-700">
                              Upload
                            </span>
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-slate-500">
                Accepted formats: PDF, JPG, PNG. Maximum file size: 10MB
              </p>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  Review your information
                </h2>
                <p className="text-sm text-slate-500">
                  Please review your details before submitting for verification
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-slate-900">Business Information</h3>
                    <button onClick={() => setCurrentStep(1)} className="text-sm text-primary-600 hover:text-primary-700">
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-500">Business name:</span>{' '}
                      <span className="text-slate-900">{data.businessName || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Type:</span>{' '}
                      <span className="text-slate-900 capitalize">{data.businessType || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Industry:</span>{' '}
                      <span className="text-slate-900 capitalize">{data.industry || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Website:</span>{' '}
                      <span className="text-slate-900">{data.website || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-slate-900">Business Address</h3>
                    <button onClick={() => setCurrentStep(2)} className="text-sm text-primary-600 hover:text-primary-700">
                      Edit
                    </button>
                  </div>
                  <p className="text-sm text-slate-900">
                    {data.address1}
                    {data.address2 && `, ${data.address2}`}
                    <br />
                    {data.city}, {data.state} {data.postalCode}
                    <br />
                    {data.phone}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-slate-900">Documents</h3>
                    <button onClick={() => setCurrentStep(3)} className="text-sm text-primary-600 hover:text-primary-700">
                      Edit
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.documents.filter(d => d.uploaded).map((doc) => (
                      <span key={doc.type} className="inline-flex items-center gap-1 px-2 py-1 bg-success-100 text-success-700 text-xs rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        {doc.type.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-slate-600">
                  I certify that all information provided is accurate and complete. I understand that providing false information may result in account termination.
                </span>
              </label>
            </div>
          )}
        </Card>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed()} loading={loading}>
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading} disabled={!canProceed()}>
              Submit for verification
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
