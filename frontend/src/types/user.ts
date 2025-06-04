// User roles enum
export enum UserRole {
  MEMBER = 'member',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
  TREASURER = 'treasurer',
  FINANCIAL_SECRETARY = 'financial_secretary',
  SECRETARY = 'secretary',
  CHAIRPERSON = 'chairperson',
  VICE_CHAIRPERSON = 'vice_chairperson',
}

// User status enum
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
}

// Base user interface
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  profilePicture?: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

// Member user interface (extends base user)
export interface MemberUser extends User {
  pcnLicense?: string;
  membershipNumber?: string;
  membershipDate?: string;
  pharmacyId?: string;
}

// User create/update payload
export interface UserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
  pcnLicense?: string;
  membershipNumber?: string;
  membershipDate?: string;
}
