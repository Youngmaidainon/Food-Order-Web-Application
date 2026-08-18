import { useQuery } from '@tanstack/react-query';
import { sendApiRequest } from '../api/api.js';

export function useMenu() {
  return useQuery({
    queryKey: ['menu_and_dressings'],
    queryFn: async () => {
      const [menuRes, dressingsRes] = await Promise.all([
        sendApiRequest('/menu'),
        sendApiRequest('/dressings')
      ]);

      const menuItems = menuRes.success ? menuRes.data : [];
      let dressings = dressingsRes.success ? dressingsRes.data : [];
      
      if (!dressings.some(d => d.id === 0)) {
        dressings = [{ id: 0, name: 'ไม่รับน้ำสลัด', is_available: true }, ...dressings];
      }

      return { menuItems, dressings };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useStoreStatus() {
  return useQuery({
    queryKey: ['storeStatus'],
    queryFn: async () => {
      const response = await sendApiRequest('/store/status');
      if (!response.success) throw new Error('Failed to fetch store status');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
