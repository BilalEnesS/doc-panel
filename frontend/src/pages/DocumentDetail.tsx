import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { documentService } from '../services/documentService';
import { DocumentUpdateRequest } from '../types/document';
import { useState, useEffect, useRef } from 'react';

function getStatusBadge(status: string) {
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
  return badges[status as keyof typeof badges] || badges.uploading;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('tr-TR');
}

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const { data: document, isLoading, error } = useQuery({
    queryKey: ['document', id],
    queryFn: () => documentService.getDocument(Number(id)),
    enabled: !!id,
    refetchInterval: (query) => {
      const doc = query.state.data;
      // Poll if document is processing
      return doc?.status === 'processing' ? 2000 : false;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: DocumentUpdateRequest) =>
      documentService.updateDocument(Number(id!), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => documentService.deleteDocument(Number(id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      navigate('/');
    },
  });

  const reprocessMutation = useMutation({
    mutationFn: () => documentService.reprocessDocument(Number(id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      // Force refetch of documents list
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.refetchQueries({ queryKey: ['documents'] });
    },
  });

  // Track previous status to detect changes
  const previousStatusRef = useRef<string | undefined>(undefined);
  
  useEffect(() => {
    if (document?.status && previousStatusRef.current !== document.status) {
      // Status changed, invalidate and refetch documents list
      if (previousStatusRef.current && document.status === 'completed') {
        // Status changed to completed, force update the list
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        queryClient.refetchQueries({ queryKey: ['documents'] });
      }
      previousStatusRef.current = document.status;
    }
  }, [document?.status, queryClient]);

  const handleEdit = () => {
    if (document) {
      setEditTitle(document.title);
      setEditCategory(document.category || '');
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({
      title: editTitle,
      category: editCategory || undefined,
    });
  };

  const handleDelete = () => {
    if (confirm('Bu belgeyi silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Yükleniyor...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !document) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">Belge bulunamadı</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </Layout>
    );
  }

  const statusBadge = getStatusBadge(document.status);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Geri
          </button>
          <div className="flex gap-2">
            {document.status === 'failed' && (
              <button
                onClick={() => reprocessMutation.mutate()}
                disabled={reprocessMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                OCR'ı Yeniden İşle
              </button>
            )}
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Düzenle
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Sil
            </button>
          </div>
        </div>

        {/* Document Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Başlık
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kategori
                </label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Kaydet
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  İptal
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {document.title}
                  </h1>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusBadge.className}`}
                  >
                    {statusBadge.label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Dosya Adı</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {document.filename}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Dosya Tipi</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white uppercase">
                    {document.file_type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Dosya Boyutu</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatFileSize(document.file_size)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Kategori</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {document.category || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Oluşturulma</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(document.created_at)}
                  </p>
                </div>
                {document.updated_at && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Güncellenme</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(document.updated_at)}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Extracted Text */}
        {document.extracted_text && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Çıkarılan Metin
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-[600px]">
                {document.extracted_text}
              </pre>
            </div>
          </div>
        )}

        {/* Summary */}
        {document.summary && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Özet</h2>
            <p className="text-gray-700 dark:text-gray-300">{document.summary}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

