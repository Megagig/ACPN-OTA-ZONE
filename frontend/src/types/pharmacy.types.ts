export interface SocialMediaLinks {
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
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
}

export interface PharmacyDue {
  _id: string;
  pharmacyId: string;
  dueId: string;
  dueType: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paidAmount?: number;
  paidDate?: string;
  balance?: number;
  description?: string;
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
