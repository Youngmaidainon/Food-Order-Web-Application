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
    staleTime: 10000,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
  });
}

export function useActiveOrderTracking(orderNumber) {
  return useQuery({
    queryKey: ['activeOrder', orderNumber],
    queryFn: async () => {
      if (!orderNumber) return null;
      const response = await sendApiRequest(`/orders/track/${orderNumber}`);
      if (!response.success) throw new Error(response.message || 'ไม่พบออเดอร์');
      return response.data;
    },
    enabled: !!orderNumber,
    staleTime: 2000,
    refetchInterval: (query) => {
      const data = query?.state?.data;
      const status = data?.status;
      const terminalStatuses = ['เสร็จสิ้น', 'ยกเลิก', 'รับอาหารแล้ว', 'จัดส่งแล้ว'];
      if (status && terminalStatuses.includes(status)) {
        return false;
      }
      return 4000;
    },
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
  });
}

export function useAdminOrders(statusFilter = 'ทั้งหมด') {
  return useQuery({
    queryKey: ['adminOrders', statusFilter],
    queryFn: async () => {
      const response = await sendApiRequest(`/admin/orders?status=${statusFilter}&limit=100&_t=${Date.now()}`);
      if (!response.success) throw new Error(response.message || 'โหลดรายการออเดอร์ไม่สำเร็จ');
      return response.data || [];
    },
    staleTime: 2000,
    refetchInterval: 4000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
  });
}
