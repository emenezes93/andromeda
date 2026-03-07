/**
 * P1.1 — Exibe imagem de progresso. Se imageUrl for relativo (/v1/...), faz fetch com auth e exibe via blob URL.
 */

import { useEffect, useRef, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {};
  const token = localStorage.getItem('token');
  const tenantId = localStorage.getItem('tenantId');
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  if (tenantId) (headers as Record<string, string>)['x-tenant-id'] = tenantId;
  return headers;
}

export interface ProgressPhotoImageProps {
  imageUrl: string;
  alt: string;
  className?: string;
  onError?: () => void;
}

export function ProgressPhotoImage({ imageUrl, alt, className, onError }: ProgressPhotoImageProps) {
  const isRelative = imageUrl.startsWith('/');
  const [src, setSrc] = useState<string | null>(() => (isRelative ? null : imageUrl));
  const [failed, setFailed] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isRelative) {
      setSrc(imageUrl);
      return () => {};
    }
    let cancelled = false;
    const fullUrl = `${API_URL}${imageUrl}`;
    fetch(fullUrl, { headers: getAuthHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setSrc(url);
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          onError?.();
        }
      });
    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [imageUrl, isRelative, onError]);

  if (failed) return <div className={className} role="img" aria-label={alt} />;
  if (isRelative && !src) {
    return (
      <div className={className} style={{ minHeight: 120 }} aria-hidden>
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  return (
    <img
      src={src ?? imageUrl}
      alt={alt}
      className={className}
      onError={() => {
        setFailed(true);
        onError?.();
      }}
    />
  );
}
