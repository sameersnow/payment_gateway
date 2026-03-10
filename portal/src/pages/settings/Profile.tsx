import { useState, useEffect } from 'react';
import { Upload, Building2, Globe, Mail, Phone } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Input, Select } from '../../components/ui';
import { useMerchantProfile } from '../../hooks';
import { useAuth } from '../../hooks';
import { toast } from 'sonner';

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

export function Profile() {
  const { refreshUser } = useAuth();

  // Use the new SDK hook
  const { profile, updateProfile: updateProfileHook, uploadLogo } = useMerchantProfile();

  const [businessInfo, setBusinessInfo] = useState({
    businessName: '',
    website: '',
    industry: 'technology',
    description: '',
    phone: '',
    email: '',
    logo: '',
  });

  const [brandSettings, setBrandSettings] = useState({
    statementDescriptor: 'TECHCORP',
    brandColor: '#1e293b',
  });

  const [saving, setSaving] = useState(false);

  // Populate form when profile data loads
  useEffect(() => {
    if (profile) {
      setBusinessInfo({
        businessName: profile.company_name || '',
        website: profile.website || '',
        industry: 'technology', // Map from backend if available
        description: '',
        phone: profile.contact_detail || '',
        email: profile.company_email || '',
        logo: profile.logo || ''
      });
    }
  }, [profile]);


  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfileHook({
        company_name: businessInfo.businessName,
        website: businessInfo.website,
        contact_detail: businessInfo.phone,
        company_email: businessInfo.email,
      });
      // Toast shown by hook
    } catch (err) {
      // Error toast shown by hook
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your business information and branding
          </p>
        </div>

        <Card>
          <h3 className="text-lg font-medium text-slate-900 mb-6">Business Logo</h3>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-xl bg-primary-100 flex items-center justify-center overflow-hidden relative">
              {businessInfo.logo ? (
                <img src={businessInfo.logo} alt="Business Code" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-10 h-10 text-primary-600" />
              )}
            </div>
            <div>
              <input
                type="file"
                id="logo-upload"
                className="hidden"
                accept="image/png, image/jpeg"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  // Check file size (5MB limit)
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error('File size must be less than 5MB');
                    return;
                  }

                  try {
                    const logoUrl = await uploadLogo(file);
                    // Toast shown by hook
                    setBusinessInfo(prev => ({ ...prev, logo: logoUrl }));
                    if (refreshUser) refreshUser();
                  } catch (err: any) {
                    // Error already shown by hook
                  }
                }}
              />
              <Button variant="secondary" size="sm" onClick={() => document.getElementById('logo-upload')?.click()}>
                <Upload className="w-4 h-4" />
                Upload logo
              </Button>
              <p className="text-xs text-slate-500 mt-2">
                Recommended: 512x512px, PNG or JPG
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-slate-900 mb-6">Business Information</h3>
          <div className="grid grid-cols-2 gap-6">
            <Input
              label="Business name"
              value={businessInfo.businessName}
              onChange={(e) => setBusinessInfo({ ...businessInfo, businessName: e.target.value })}
              leftIcon={<Building2 className="w-4 h-4" />}
            />
            <Input
              label="Website"
              value={businessInfo.website}
              onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
              leftIcon={<Globe className="w-4 h-4" />}
            />
            <Input
              label="Email"
              type="email"
              value={businessInfo.email}
              onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
              leftIcon={<Mail className="w-4 h-4" />}
            />
            <Input
              label="Phone"
              type="tel"
              value={businessInfo.phone}
              onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
              leftIcon={<Phone className="w-4 h-4" />}
            />
            <Select
              label="Industry"
              options={industries}
              value={businessInfo.industry}
              onChange={(e) => setBusinessInfo({ ...businessInfo, industry: e.target.value })}
            />
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Business description
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={businessInfo.description}
                onChange={(e) => setBusinessInfo({ ...businessInfo, description: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveProfile} disabled={saving}>Save changes</Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-slate-900 mb-6">Brand Settings</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Input
                label="Statement descriptor"
                value={brandSettings.statementDescriptor}
                onChange={(e) => setBrandSettings({ ...brandSettings, statementDescriptor: e.target.value })}
                hint="Appears on customer's bank statements"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Brand color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brandSettings.brandColor}
                  onChange={(e) => setBrandSettings({ ...brandSettings, brandColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={brandSettings.brandColor}
                  onChange={(e) => setBrandSettings({ ...brandSettings, brandColor: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Used in hosted payment pages and emails
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveProfile} disabled={saving}>Save changes</Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
