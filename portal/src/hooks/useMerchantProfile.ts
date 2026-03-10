import { useFrappeAuth, useFrappeGetDoc, useFrappeUpdateDoc, useFrappeFileUpload } from 'frappe-react-sdk';
import { toast } from 'sonner';

interface MerchantProfile {
    name: string;
    company_name: string;
    company_email: string;
    contact_detail: string;
    website: string;
    logo: string;
    status: string;
    personal_email: string;
    personal_name: string;
}

interface UpdateProfileData {
    company_name?: string;
    company_email?: string;
    contact_detail?: string;
    website?: string;
}

export function useMerchantProfile() {
    const { currentUser } = useFrappeAuth();

    // Fetch merchant profile
    const { data: profile, error, isLoading, mutate } = useFrappeGetDoc<MerchantProfile>(
        'Merchant',
        currentUser || undefined,
        currentUser ? 'merchant_profile' : null // Conditional fetching
    );

    const { updateDoc } = useFrappeUpdateDoc();
    const { upload, loading: uploading } = useFrappeFileUpload();

    const updateProfile = async (data: UpdateProfileData) => {
        try {
            await updateDoc('Merchant', currentUser || '', data);
            toast.success('Profile updated successfully');
            mutate(); // Refresh profile data
        } catch (err: any) {
            const errorMessage = err?.message || 'Failed to update profile';
            toast.error(errorMessage);
            throw err;
        }
    };

    const uploadLogo = async (file: File) => {
        try {
            // Validate file type
            const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                throw new Error('Only JPG, PNG files are allowed');
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('File size must be less than 5MB');
            }

            // Upload file using SDK (PRIVATE)
            const result = await upload(file, {
                isPrivate: true, // Logo should be public
                doctype: 'Merchant',
                docname: currentUser || '',
                fieldname: 'logo',
            });

            // Update the Merchant doc with the file URL
            await updateDoc('Merchant', currentUser || '', {
                logo: result.file_url
            });

            toast.success('Logo uploaded successfully');
            mutate(); // Refresh to get new logo URL
            return result.file_url;
        } catch (err: any) {
            const errorMessage = err?.message || 'Failed to upload logo';
            toast.error(errorMessage);
            throw err;
        }
    };

    return {
        profile,
        isLoading,
        error,
        updateProfile,
        uploadLogo,
        refresh: mutate
    };
}
