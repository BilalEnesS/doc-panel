import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { documentService } from '../services/documentService';
import { Document, DocumentListParams } from '../types/document';

const stats = [
  { label: 'Aktif Belgeler', value: '24', change: '+12%', changeType: 'positive' },
  { label: 'Bekleyen OCR İşlemi', value: '3', change: '-2', changeType: 'neutral' },
  { label: 'AI Özetleri', value: '18', change: '+30%', changeType: 'positive' },
  { label: 'Chat Oturumları', value: '42', change: '+9%', changeType: 'positive' },
];

const quickActions = [
  {
    title: 'Belge Yükle',
    description: 'PDF, görsel veya DOCX dosyalarınızı hızlıca sisteme aktarın.',
    to: '/documents/upload',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    title: 'AI Analizi Başlat',
    description: 'OCR, kategorizasyon ve özetleme işlemlerini yönetin.',
    to: '/',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z"
        />
      </svg>
    ),
  },
  {
    title: 'Belge Arama',
    description: 'Semantic search ile belgelerinizdeki içeriği keşfedin.',
    to: '/',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-5.197-5.197M15.803 15.803A7.5 7.5 0 1 1 18 9a7.5 7.5 0 0 1-2.197 6.803Z"
        />
      </svg>
    ),
  },
];

function getStatusBadge(status: Document['status']) {
  const badges = {
    uploading: {
      label: 'Yükleniyor',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-300',
    },
    processing: {
      label: 'OCR İşleniyor',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-300',
    },
    completed: {
      label: 'Tamamlandı',
      className: 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-300',
    },
    failed: {
      label: 'Başarısız',
      className: 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300',
    },
  };
  return badges[status];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState<DocumentListParams>({
    limit: 20,
    offset: 0,
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  // Clean filters: remove empty strings and convert to undefined
  const cleanFilters: DocumentListParams = useMemo(() => {
    const cleaned: DocumentListParams = {
      limit: filters.limit,
      offset: filters.offset,
      sort_by: filters.sort_by,
      sort_order: filters.sort_order,
    };
    if (filters.status) cleaned.status = filters.status;
    if (filters.file_type) cleaned.file_type = filters.file_type;
    if (filters.category?.trim()) cleaned.category = filters.category.trim();
    if (filters.search?.trim()) cleaned.search = filters.search.trim();
    return cleaned;
  }, [filters.limit, filters.offset, filters.sort_by, filters.sort_order, filters.status, filters.file_type, filters.category, filters.search]);

  // Create stable query key
  const queryKey = useMemo(() => {
    return [
      'documents',
      filters.limit,
      filters.offset,
      filters.sort_by,
      filters.sort_order,
      filters.status || null,
      filters.file_type || null,
      filters.category?.trim() || null,
      filters.search?.trim() || null,
    ];
  }, [filters.limit, filters.offset, filters.sort_by, filters.sort_order, filters.status, filters.file_type, filters.category, filters.search]);

  // Fetch documents - NO automatic polling
  const { data: documentList, refetch } = useQuery({
    queryKey,
    queryFn: () => documentService.listDocuments(cleanFilters),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Refetch when returning to home page (in case document was updated)
  const prevPathRef = useRef<string>('');
  useEffect(() => {
    const currentPath = location.pathname;
    // If we're on home page and came from a document detail page, force refetch
    if (currentPath === '/' && prevPathRef.current.startsWith('/documents/') && prevPathRef.current !== currentPath) {
      // Invalidate and refetch to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      refetch();
    }
    prevPathRef.current = currentPath;
  }, [location.pathname, refetch, queryClient]);

  // Manual polling only when there are processing documents
  const hasProcessing = useMemo(() => {
    return documentList?.documents?.some((doc) => doc.status === 'processing') ?? false;
  }, [documentList?.documents]);
  
  useEffect(() => {
    if (!hasProcessing) return;
    
    const interval = setInterval(() => {
      // Only refetch if there are still processing documents
      queryClient.refetchQueries({ queryKey, exact: true });
    }, 5000); // Poll every 5 seconds instead of 3
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasProcessing]); // Only depend on hasProcessing - queryKey and queryClient are stable

  const deleteMutation = useMutation({
    mutationFn: (id: number) => documentService.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const documents = documentList?.documents || [];
  const total = documentList?.total || 0;

  // Update stats based on actual data
  const completedCount = documents.filter((d) => d.status === 'completed').length;
  const processingCount = documents.filter((d) => d.status === 'processing').length;

  const handleDelete = (id: number, title: string) => {
    if (confirm(`"${title}" belgesini silmek istediğinizden emin misiniz?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Layout
      title={`Merhaba, ${user?.first_name ?? 'kullanıcı'} 👋`}
      description="Belgelerinizi yükleyin, AI ile analiz edin ve hızlıca içgörü elde edin."
      actions={
        <Link
          to="/documents/upload"
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Yeni Belge
        </Link>
      }
    >
      <section className="grid gap-6 lg:grid-cols-4">
        <div
          className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-lg shadow-gray-200/40 transition hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900/80 dark:shadow-gray-900/40"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Aktif Belgeler</p>
          </div>
          <p className="mt-4 text-3xl font-semibold text-gray-900 dark:text-white">
            {documents.length}
          </p>
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-blue-500/40 via-transparent to-transparent transition group-hover:from-blue-500/70" />
        </div>
        <div
          className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-lg shadow-gray-200/40 transition hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900/80 dark:shadow-gray-900/40"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Bekleyen OCR İşlemi
            </p>
          </div>
          <p className="mt-4 text-3xl font-semibold text-gray-900 dark:text-white">
            {processingCount}
          </p>
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-blue-500/40 via-transparent to-transparent transition group-hover:from-blue-500/70" />
        </div>
        <div
          className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-lg shadow-gray-200/40 transition hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900/80 dark:shadow-gray-900/40"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tamamlanan</p>
          </div>
          <p className="mt-4 text-3xl font-semibold text-gray-900 dark:text-white">
            {completedCount}
          </p>
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-green-500/40 via-transparent to-transparent transition group-hover:from-green-500/70" />
        </div>
        <div
          className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-lg shadow-gray-200/40 transition hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900/80 dark:shadow-gray-900/40"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">AI Özetleri</p>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-600 dark:bg-green-500/10 dark:text-green-300">
              +30%
            </span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-gray-900 dark:text-white">18</p>
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-purple-500/40 via-transparent to-transparent transition group-hover:from-purple-500/70" />
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-lg shadow-gray-200/40 dark:border-gray-800 dark:bg-gray-900/80 dark:shadow-gray-900/40">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Belgelerim {total > 0 && <span className="text-sm text-gray-500">({total})</span>}
            </h2>
            <Link
              to="/documents/upload"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Yeni Ekle →
            </Link>
          </div>

          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Ara..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, offset: 0 })}
              className="flex-1 min-w-[200px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
            <select
              value={filters.status || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: (e.target.value || undefined) as Document['status'] | undefined,
                  offset: 0,
                })
              }
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="">Tüm Durumlar</option>
              <option value="completed">Tamamlandı</option>
              <option value="processing">İşleniyor</option>
              <option value="failed">Başarısız</option>
            </select>
            <select
              value={filters.file_type || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  file_type: (e.target.value || undefined) as Document['file_type'] | undefined,
                  offset: 0,
                })
              }
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="">Tüm Tipler</option>
              <option value="pdf">PDF</option>
              <option value="image">Görsel</option>
              <option value="docx">DOCX</option>
            </select>
            <select
              value={`${filters.sort_by}_${filters.sort_order}`}
              onChange={(e) => {
                const [sort_by, sort_order] = e.target.value.split('_');
                setFilters({ ...filters, sort_by, sort_order: sort_order as 'asc' | 'desc' });
              }}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="created_at_desc">En Yeni</option>
              <option value="created_at_asc">En Eski</option>
              <option value="title_asc">Başlık (A-Z)</option>
              <option value="title_desc">Başlık (Z-A)</option>
            </select>
          </div>

          {documents.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
                Henüz belge yok
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                İlk belgenizi yükleyerek başlayın
              </p>
              <Link
                to="/documents/upload"
                className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Belge Yükle
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => {
                const badge = getStatusBadge(document.status);
                return (
                  <div
                    key={document.id}
                    className="group rounded-2xl border border-gray-200 bg-white/60 p-4 transition hover:border-blue-500/40 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/60 dark:hover:border-blue-500/40"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => navigate(`/documents/${document.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {document.title}
                          </h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{document.filename}</span>
                          <span>•</span>
                          <span>{formatFileSize(document.file_size)}</span>
                          <span>•</span>
                          <span>{new Date(document.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                        {document.status === 'processing' && (
                          <div className="mt-3">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                              <div className="h-full animate-pulse bg-gradient-to-r from-blue-500 to-indigo-500" />
                            </div>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              OCR işlemi devam ediyor...
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/documents/${document.id}`);
                          }}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                          Görüntüle
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(document.id, document.title);
                          }}
                          disabled={deleteMutation.isPending}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-500/10 via-white to-blue-500/10 p-6 shadow-lg shadow-purple-200/40 dark:border-purple-500/20 dark:from-purple-500/10 dark:via-gray-900 dark:to-blue-500/10 dark:shadow-purple-900/40">
            <h3 className="text-base font-semibold text-purple-600 dark:text-purple-300">
              AI Pipeline Durumu
            </h3>
            <div className="mt-4 space-y-3">
              {[
                { label: 'OCR İşleme', progress: processingCount > 0 ? 65 : 100 },
                { label: 'Semantic Indexing', progress: 40 },
                { label: 'Özetleme', progress: 78 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <span>{item.label}</span>
                    <span>{item.progress}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/60 dark:bg-gray-800/80">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 dark:from-purple-400 dark:via-blue-400 dark:to-indigo-400"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-lg shadow-gray-200/40 dark:border-gray-800 dark:bg-gray-900/80 dark:shadow-gray-900/40">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Son Aktiviteler
            </h3>
            <ul className="mt-4 space-y-3">
              {documents.slice(0, 3).map((doc) => {
                const badge = getStatusBadge(doc.status);
                return (
                  <li
                    key={doc.id}
                    className="rounded-2xl border border-gray-100 bg-white/60 p-4 transition hover:border-blue-500/40 dark:border-gray-800 dark:bg-gray-900/60 dark:hover:border-blue-500/40"
                  >
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {doc.title}
                    </p>
                    <p className={`mt-1 text-xs font-medium ${badge.className.split(' ')[1]}`}>
                      {badge.label}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(doc.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </li>
                );
              })}
              {documents.length === 0 && (
                <li className="rounded-2xl border border-gray-100 bg-white/60 p-4 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-400">
                  Henüz aktivite yok
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>
    </Layout>
  );
}
