import { Announcement, AnnouncementCreate, AnnouncementUpdate } from '../types/announcement.types';

const API_URL = '/api/announcements';

export const getAnnouncements = async (): Promise<Announcement[]> => {
  try {
    const response = await fetch(`${API_URL}`);
    if (!response.ok) {
      throw new Error('Failed to fetch announcements');
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }
};

export const getAnnouncementById = async (id: string): Promise<Announcement> => {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch announcement');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching announcement:', error);
    throw error;
  }
};

export const createAnnouncement = async (data: AnnouncementCreate): Promise<Announcement> => {
  try {
    const response = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create announcement');
    }
    const responseData = await response.json();
    return responseData.data;
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }
};

export const updateAnnouncement = async (id: string, data: AnnouncementUpdate): Promise<Announcement> => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update announcement');
    }
    const responseData = await response.json();
    return responseData.data;
  } catch (error) {
    console.error('Error updating announcement:', error);
    throw error;
  }
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete announcement');
    }
  } catch (error) {
    console.error('Error deleting announcement:', error);
    throw error;
  }
}; 