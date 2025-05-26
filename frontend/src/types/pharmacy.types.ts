export interface SocialMediaLinks {
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
}

export interface DueType {
  _id: string;
  name: string;
  description?: string;
  defaultAmount: number;
  isRecurring?: boolean;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PharmacyRegistrationStatus =
  | 'active'
  | 'pending'
  | 'expired'
  | 'suspended';

export interface PharmacyFormData {
  name: string;
  email: string;
  phone: string;
  yearEstablished?: number;
  address: string; // Street Address
  landmark: string;
  townArea: string;
  // registrationNumber is auto-generated, so not in form data for creation
  pcnLicense: string; // "Previous Pharmacy License Number"
  licenseExpiryDate: string; // Should be string for input[type=date], converted in backend
  numberOfStaff?: number;
  superintendentName: string;
  superintendentLicenseNumber: string;
  superintendentPhoto?: File | string; // File for upload, string for existing URL
  superintendentPhone: string;
  directorName: string;
  directorPhoto?: File | string; // File for upload, string for existing URL
  directorPhone: string;
  operatingHours?: string;
  websiteUrl?: string;
  socialMedia?: SocialMediaLinks;
  servicesOffered?: string[];
  _id?: string;
}

export interface Pharmacy extends PharmacyFormData {
  _id: string;
  registrationNumber: string;
  registrationStatus: PharmacyRegistrationStatus;
  registrationDate: string; // Should be string
  createdAt: string;
  updatedAt: string;
  // Override photo types to be strings only for API responses
  superintendentPhoto: string;
  directorPhoto: string;
}

export interface PharmacyDue {
  _id: string;
  pharmacyId: string;
  dueTypeId: {
    _id: string;
    name: string;
    description?: string;
    isRecurring: boolean;
  };
  title: string;
  description?: string;
  amount: number;
  dueDate: string;
  paymentStatus: 'pending' | 'paid' | 'overdue' | 'partially_paid';
  amountPaid: number;
  balance: number;
  penalties: Array<{
    amount: number;
    reason: string;
    addedBy: string;
    addedAt: string;
  }>;
  totalAmount: number;
  assignmentType: 'individual' | 'bulk';
  assignedBy: string;
  assignedAt: string;
  year: number;
  isRecurring: boolean;
  nextDueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSubmission {
  _id: string;
  dueId:
    | string
    | {
        _id: string;
        title: string;
        dueTypeId: {
          _id: string;
          name: string;
        };
      };
  pharmacyId: string;
  amount: number;
  paymentMethod: 'bank_transfer' | 'cash' | 'cheque' | 'mobile_payment';
  paymentReference?: string;
  receiptUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  submittedBy: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PharmacyStats {
  totalPharmacies: number;
  activePharmacies: number;
  pendingApproval: number;
  recentlyAdded: number;
  duesCollected: number;
  duesOutstanding: number;
}
