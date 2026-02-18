import type { Template, TemplateListResponse } from '@/types';
import { apiFetch } from './client';

export interface ListTemplatesParams {
  page?: number;
  limit?: number;
}

export async function listTemplates(
  params: ListTemplatesParams = {}
): Promise<TemplateListResponse> {
  const search = new URLSearchParams();
  if (params.page != null) search.set('page', String(params.page));
  if (params.limit != null) search.set('limit', String(params.limit));
  const qs = search.toString();
  return apiFetch<TemplateListResponse>(`/v1/anamnesis/templates${qs ? `?${qs}` : ''}`);
}

export async function getTemplate(id: string): Promise<Template> {
  return apiFetch<Template>(`/v1/anamnesis/templates/${id}`);
}

export interface CreateTemplateBody {
  name: string;
  schemaJson: {
    questions: Array<{
      id: string;
      text: string;
      type: 'text' | 'number' | 'single' | 'multiple';
      options?: string[];
      required: boolean;
      tags?: string[];
    }>;
    conditionalLogic?: Array<{
      ifQuestion: string;
      ifValue: string | string[];
      thenShow: string[];
    }>;
    tags?: string[];
  };
}

export async function createTemplate(body: CreateTemplateBody): Promise<Template> {
  return apiFetch<Template>('/v1/anamnesis/templates', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
