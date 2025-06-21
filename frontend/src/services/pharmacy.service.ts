import api from './api';
import type {
  Pharmacy,
  PharmacyDue,
  PharmacyStats,
} from '../types/pharmacy.types';

class PharmacyService {
  // Get all pharmacies with optional pagination
  async getPharmacies(
    page = 1,
    limit = 10,
    filters = {}
  ): Promise<{ pharmacies: Pharmacy[]; total: number }> {
    const response = await api.get('/api/pharmacies', {
      params: { page, limit, ...filters },
    });    return {
      pharmacies: response.data?.data?.pharmacies || response.data?.pharmacies || [],
      total: response.data?.data?.total || response.data?.total || 0,
    };
  }

  // Get a single pharmacy by ID
  async getPharmacy(id: string): Promise<Pharmacy> {
    const response = await api.get(`/pharmacies/${id}`);
    return response.data.data;
  }

  // Create a new pharmacy
  async createPharmacy(pharmacyData: FormData): Promise<Pharmacy> {
    const response = await api.post('/api/pharmacies', pharmacyData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  // Update a pharmacy
  async updatePharmacy(id: string, pharmacyData: FormData): Promise<Pharmacy> {
    const response = await api.put(`/pharmacies/${id}`, pharmacyData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  // Delete a pharmacy
  async deletePharmacy(id: string): Promise<void> {
    await api.delete(`/pharmacies/${id}`);
  }

  // Update pharmacy status
  async approvePharmacy(id: string): Promise<Pharmacy> {
    const response = await api.put(`/pharmacies/${id}/status`);
    return response.data.data;
  }

  // Get pharmacy dues
  async getPharmacyDues(
    pharmacyId: string,
    page = 1,
    limit = 10
  ): Promise<{ dues: PharmacyDue[]; total: number }> {
    const response = await api.get(`/pharmacies/${pharmacyId}/dues`, {
      params: { page, limit },
    });
    return response.data;
  }

  // Pay a pharmacy due
  async payDue(
    pharmacyId: string,
    dueId: string,
    paymentData: {
      amount: number;
      paymentDate?: string;
      paymentMethod?: string;
      reference?: string;
    }
  ): Promise<PharmacyDue> {
    const response = await api.put(
      `/pharmacies/${pharmacyId}/dues/${dueId}/pay`,
      paymentData
    );
    return response.data.data;
  }

  // Get pharmacy statistics
  async getPharmacyStats(): Promise<PharmacyStats> {
    const response = await api.get('/api/pharmacies/stats');
    return response.data.data;
  }

  // Get pharmacy by user ID
  async getPharmacyByUser(): Promise<Pharmacy | null> {
    try {
      const response = await api.get('/api/pharmacies/me');
      return response.data.data;
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response === 'object' &&
        (error as any).response !== null &&
        'status' in (error as any).response &&
        (error as any).response.status === 404
      ) {
        return null;
      }
      throw error;
    }
  }

  // Search pharmacies
  async searchPharmacies(query: string): Promise<Pharmacy[]> {
    const response = await api.get('/api/pharmacies/search', {
      params: { q: query },
    });
    return response.data.data;
  }
}

export default new PharmacyService();
