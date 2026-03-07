import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTenant, updateTenant, uploadTenantLogo } from '@/api/tenants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { track } from '@/lib/analytics';

const API_URL = import.meta.env.VITE_API_URL || '';

export function OrganizationSettingsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const tenantId = localStorage.getItem('tenantId') ?? '';

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => getTenant(tenantId),
    enabled: !!tenantId,
  });

  const [name, setName] = useState('');
  const [brandColor, setBrandColor] = useState('#6366f1');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (tenant) {
      setName(tenant.name ?? '');
      setBrandColor(tenant.brandColor ?? '#6366f1');
      setLogoPreview(tenant.logoUrl ?? null);
    }
  }, [tenant]);

  const updateMutation = useMutation({
    mutationFn: () => updateTenant(tenantId, { name, brandColor }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      toast.success('Configurações salvas.');
      track({ name: 'settings_updated' });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro'),
  });

  const logoMutation = useMutation({
    mutationFn: (file: File) => uploadTenantLogo(tenantId, file),
    onSuccess: (res) => {
      setLogoPreview(res.logoUrl);
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      toast.success('Logo atualizado.');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro'),
  });

  const handleSave = () => {
    updateMutation.mutate();
    if (logoFile) logoMutation.mutate(logoFile);
  };

  if (isLoading) {
    return (
      <div className="h-64 animate-pulse rounded-card bg-surface-muted" aria-hidden />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-heading font-semibold text-content">
        Configurações da Organização
      </h1>

      <Card padding="md">
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-body-sm font-medium text-content-muted">
              Logo
            </label>
            <div className="flex items-center gap-4">
              {logoPreview && (
                <img
                  src={logoPreview.startsWith('http') ? logoPreview : `${API_URL}${logoPreview}`}
                  alt="Logo"
                  className="h-16 w-16 rounded-card border border-border object-contain"
                />
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setLogoFile(f);
                    setLogoPreview(URL.createObjectURL(f));
                  }
                }}
                className="text-body-sm text-content"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-body-sm font-medium text-content-muted">
              Nome da organização
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              name="org-name"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-body-sm font-medium text-content-muted">
              Cor principal da marca
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-border"
                aria-label="Cor da marca"
              />
              <Input
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-32"
                name="brand-color"
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-body-sm text-content-muted">Preview:</span>
              <span
                className="inline-block h-6 w-20 rounded border border-border"
                style={{ backgroundColor: brandColor }}
                aria-hidden
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            loading={updateMutation.isPending || logoMutation.isPending}
          >
            Salvar configurações
          </Button>
        </div>
      </Card>
    </div>
  );
}
