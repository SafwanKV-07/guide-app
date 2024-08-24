import axios from 'axios';
import { SearchResult, Update } from './types';

const API_BASE_URL = 'http://localhost:5000';

export const searchData = async (query: string): Promise<{
  exact: boolean;
  message: string;
  matches: SearchResult[];
}> => {
  const response = await axios.get(`${API_BASE_URL}/search`, { params: { query } });
  return response.data;
};

export const fetchUpdates = async (): Promise<Update[]> => {
  const response = await axios.get(`${API_BASE_URL}/updates`);
  return response.data;
};

export const reloadData = async (): Promise<{ message: string }> => {
  const response = await axios.post(`${API_BASE_URL}/reload_data`);
  return response.data;
};