/**
 * Utility functions for Admin Dashboard
 */

export function makeSubjectKey(subject: any, index: number): string {
  return String(
    subject?.id ?? 
    subject?.subject_code ?? 
    subject?.course_code ?? 
    subject?.code ?? 
    `sub-${index}`
  );
}

export function buildSubjectPayload(
  subjectCatalog: any[],
  selectedSubjectKeys: string[]
): { subject_ids: number[]; subject_codes: string[] } {
  const selected = (subjectCatalog || [])
    .map((s: any, idx: number) => {
      const key = makeSubjectKey(s, idx);
      if (!selectedSubjectKeys.includes(key)) return null;
      return { id: s.id, code: s.subject_code || s.course_code || s.code };
    })
    .filter(Boolean) as { id?: number; code?: string }[];

  const ids = Array.from(
    new Set(
      selected
        .map((x) => x.id)
        .filter((id): id is number => id !== undefined && id !== null)
    )
  );
  
  const codes = Array.from(
    new Set(
      selected
        .map((x) => x.code)
        .filter((code): code is string => Boolean(code))
    )
  );

  return { subject_ids: ids, subject_codes: codes };
}

export function exportWithToken(path: string, filename: string, apiBaseURL: string): Promise<void> {
  const token = localStorage.getItem('auth-storage');
  const parsed = token ? JSON.parse(token) : null;
  const accessToken = parsed?.state?.token;

  return fetch(`${apiBaseURL}${path}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  })
    .then(async (response) => {
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch((error) => {
      console.error('Export error:', error);
      throw error;
    });
}

export function getFilteredStaff(
  staff: any[],
  searchTerm: string
): any[] {
  if (!searchTerm.trim()) return staff;
  
  const lower = searchTerm.toLowerCase();
  return staff.filter((s) => {
    const haystack = `${s.name || ''} ${s.username || ''} ${s.email || ''} ${s.department || ''}`.toLowerCase();
    return haystack.includes(lower);
  });
}

export function formatGradeDisplay(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return typeof value === 'number' && !isNaN(value) 
    ? value.toFixed(2)
    : String(value);
}

export function getFilenamestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
}
