export interface Pharmacy {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  registrationNumber: string;
  ownerName: string;
  phone: string;
  email: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  isActive: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string; // Reference to the user who created/owns the pharmacy
  superintendentPharmacist?: string;
  superintendentLicenseNumber?: string;
  staffCount?: number;
  location?: {
    coordinates: [number, number]; // [longitude, latitude]
    type: string;
  };
  additionalInfo?: {
    establishedYear?: number;
    services?: string[];
    operatingHours?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
    };
  };
}

export interface PharmacyFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  registrationNumber: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  superintendentPharmacist?: string;
  superintendentLicenseNumber?: string;
  staffCount?: number;
  phone: string;
  email: string;
  establishedYear?: number;
  services?: string[];
  operatingHours?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
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
