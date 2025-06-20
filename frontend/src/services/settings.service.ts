import { Settings, SettingsUpdate } from '../types/settings.types';

const API_URL = '/api/settings';

export const getSettings = async (): Promise<Settings> => {
  try {
    const response = await fetch(`${API_URL}`);
    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
};

export const updateSettings = async (data: SettingsUpdate): Promise<Settings> => {
  try {
    const response = await fetch(`${API_URL}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update settings');
    }
    const responseData = await response.json();
    return responseData.data;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}; 