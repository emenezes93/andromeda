import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { getBranding } from '../api/org';
import type { BrandingResponse } from '../api/org';

const BrandingContext = createContext<BrandingResponse>({});

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { token, tenantId, isSignedIn } = useAuth();
  const [branding, setBranding] = useState<BrandingResponse>({});

  useEffect(() => {
    if (!isSignedIn || !token || !tenantId) {
      setBranding({});
      return;
    }
    getBranding(token, tenantId).then(setBranding);
  }, [isSignedIn, token, tenantId]);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): BrandingResponse {
  return useContext(BrandingContext);
}
