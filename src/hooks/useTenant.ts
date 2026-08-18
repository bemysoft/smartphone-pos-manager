import { useState, useEffect, useCallback } from "react";
import { getResolvedTenantId, setActiveTenantId, apiFetch, apiGet, apiPost } from "../lib/api";

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  phone?: string;
  subscriptionPlan: string;
  createdAt: string;
  isActive: boolean;
}

export function useTenant() {
  const [tenantId, setTenantIdState] = useState<string>(() => getResolvedTenantId());
  const [tenantDetails, setTenantDetails] = useState<TenantInfo | null>(null);
  const [availableTenants, setAvailableTenants] = useState<TenantInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Sync state if tenant changes externally or via window event
  useEffect(() => {
    const handleTenantChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ tenantId: string }>;
      if (customEvent.detail && customEvent.detail.tenantId) {
        setTenantIdState(customEvent.detail.tenantId);
      }
    };

    window.addEventListener("tenant-changed", handleTenantChange);
    return () => window.removeEventListener("tenant-changed", handleTenantChange);
  }, []);

  // Fetch available tenants list and current tenant info
  const fetchTenantData = useCallback(async () => {
    setLoading(true);
    try {
      const tenants = await apiGet<TenantInfo[]>("/api/tenants");
      if (Array.isArray(tenants)) {
        setAvailableTenants(tenants);
        const current = tenants.find(t => t.id === tenantId || t.slug === tenantId);
        if (current) {
          setTenantDetails(current);
        } else {
          setTenantDetails({
            id: tenantId,
            name: tenantId === "default" ? "Toko Utama (Default)" : `Toko ${tenantId.toUpperCase()}`,
            slug: tenantId,
            ownerName: "Administrator",
            ownerEmail: "admin@pos.local",
            subscriptionPlan: "ENTERPRISE",
            createdAt: new Date().toISOString(),
            isActive: true
          });
        }
      }
    } catch (err) {
      console.warn("Notice fetching tenant details:", err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchTenantData();
  }, [fetchTenantData]);

  const switchTenant = useCallback((newTenantId: string) => {
    const clean = newTenantId.trim().toLowerCase();
    setActiveTenantId(clean);
    setTenantIdState(clean);
  }, []);

  return {
    tenantId,
    tenantDetails,
    availableTenants,
    loading,
    switchTenant,
    refreshTenants: fetchTenantData,
    apiFetch,
    apiGet,
    apiPost
  };
}
