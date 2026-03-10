import { useFrappeAuth, useFrappeGetDoc, useFrappeUpdateDoc, useFrappeFileUpload } from 'frappe-react-sdk';
import { toast } from 'sonner';

interface KYCDocument {
    label: string;
    file_url: string | null;
    uploaded: boolean;
    requires_reupload: boolean;
}

interface KYCDocuments {
    director_pan: KYCDocument;
    director_adhar: KYCDocument;
    company_pan: KYCDocument;
    company_gst: KYCDocument;
}

interface KYCStatus {
    status: string;
    remark: string;
    documents: KYCDocuments;
    all_uploaded: boolean;
    can_submit: boolean;
}

interface MerchantKYC {
    name: string;
    status: string;
    remark: string;
    documents_to_reupload: string;
    director_pan: string;
    director_adhar: string;
    company_pan: string;
    company_gst: string;
}

export function useKYC() {
    const { currentUser } = useFrappeAuth();

    // Fetch merchant data
    const { data: merchant, error, isLoading, mutate } = useFrappeGetDoc<MerchantKYC>(
        'Merchant',
        currentUser || undefined,
        currentUser ? 'merchant_kyc' : null // Conditional fetching
    );

    const { updateDoc } = useFrappeUpdateDoc();
    const { upload } = useFrappeFileUpload();

    // Parse documents_to_reupload into array
    const getDocumentsToReupload = (): string[] => {
        if (!merchant?.documents_to_reupload) return [];
        return merchant.documents_to_reupload.split(',').map(d => d.trim()).filter(Boolean);
    };

    // Parse KYC status from merchant data
    const kycStatus: KYCStatus | null = merchant ? {
        status: merchant.status,
        remark: merchant.remark || '',
        documents: {
            director_pan: {
                label: 'Director PAN',
                file_url: merchant.director_pan || null,
                uploaded: !!merchant.director_pan,
                requires_reupload: getDocumentsToReupload().includes('director_pan')
            },
            director_adhar: {
                label: 'Director Aadhar',
                file_url: merchant.director_adhar || null,
                uploaded: !!merchant.director_adhar,
                requires_reupload: getDocumentsToReupload().includes('director_adhar')
            },
            company_pan: {
                label: 'Company PAN',
                file_url: merchant.company_pan || null,
                uploaded: !!merchant.company_pan,
                requires_reupload: getDocumentsToReupload().includes('company_pan')
            },
            company_gst: {
                label: 'Company GST',
                file_url: merchant.company_gst || null,
                uploaded: !!merchant.company_gst,
                requires_reupload: getDocumentsToReupload().includes('company_gst')
            }
        },
        all_uploaded: !!(
            merchant.director_pan &&
            merchant.director_adhar &&
            merchant.company_pan &&
            merchant.company_gst
        ),
        can_submit: merchant.status === 'Draft' && !!(
            merchant.director_pan &&
            merchant.director_adhar &&
            merchant.company_pan &&
            merchant.company_gst
        )
    } : null;

    const uploadDocument = async (documentType: 'director_pan' | 'director_adhar' | 'company_pan' | 'company_gst', file: File) => {
        try {
            // Validate file type
            const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                throw new Error('Only PNG, JPG, and PDF files are allowed');
            }

            // Validate file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('File size must be less than 10MB');
            }

            // 1. Upload file using SDK (PRIVATE)
            const result = await upload(file, {
                isPrivate: true,  // ← Changed to private
                doctype: 'Merchant',
                docname: currentUser || '',
                fieldname: documentType,
            });

            // 2. Update merchant doc with file URL
            await updateDoc('Merchant', currentUser || '', {
                [documentType]: result.file_url
            });

            // 3. Handle documents_to_reupload logic and auto-submit
            if (merchant?.documents_to_reupload) {
                const docsToReupload = getDocumentsToReupload();
                const updatedDocs = docsToReupload.filter(d => d !== documentType);

                // Check if all 4 required documents are now uploaded
                const allDocsUploaded = !!(
                    (documentType === 'director_pan' || merchant.director_pan) &&
                    (documentType === 'director_adhar' || merchant.director_adhar) &&
                    (documentType === 'company_pan' || merchant.company_pan) &&
                    (documentType === 'company_gst' || merchant.company_gst)
                );

                // If all docs uploaded AND no more docs to reupload, auto-submit
                const shouldAutoSubmit = updatedDocs.length === 0 && allDocsUploaded;

                await updateDoc('Merchant', currentUser || '', {
                    documents_to_reupload: updatedDocs.join(','),
                    ...(shouldAutoSubmit ? { status: 'Submitted', remark: '' } : {})
                });
            }

            toast.success('Document uploaded successfully');
            mutate(); // Refresh KYC data
            return result.file_url;
        } catch (err: any) {
            const errorMessage = err?.message || 'Failed to upload document';
            toast.error(errorMessage);
            throw err;
        }
    };

    return {
        kycStatus,
        isLoading,
        error,
        uploadDocument,
        refresh: mutate
    };
}
