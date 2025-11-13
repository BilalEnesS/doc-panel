/**
 * Document upload page
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { documentService } from '../services/documentService';
import { Document } from '../types/document';

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  successMessage: string | null;
  document: Document | null;
}

const initialState: UploadState = {
  isUploading: false,
  progress: 0,
  error: null,
  successMessage: null,
  document: null,
};

export default function DocumentUpload() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [state, setState] = useState<UploadState>(initialState);

  const handleFileChange = useCallback((selectedFile: File | null) => {
    setFile(selectedFile);
    if (!selectedFile) {
      setFilePreview(null);
      return;
    }

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreview(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  }, []);

  const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    handleFileChange(selectedFile);
  };

  const onDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const onDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const resetForm = () => {
    setTitle('');
    setCategory('');
    setFile(null);
    setFilePreview(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setState((prev) => ({ ...prev, error: 'Lütfen bir dosya seçin.' }));
      return;
    }

    setState({
      isUploading: true,
      progress: 25,
      error: null,
      successMessage: null,
      document: null,
    });

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('file', file);
      if (category.trim()) {
        formData.append('category', category.trim());
      }

      const response = await documentService.uploadDocument(formData);

      setState({
        isUploading: false,
        progress: 100,
        error: null,
        successMessage: response.message,
        document: response.document,
      });

      resetForm();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ??
        error.message ??
        'Belge yüklenirken bir hata oluştu.';

      setState({
        isUploading: false,
        progress: 0,
        error: errorMessage,
        successMessage: null,
        document: null,
      });
    }
  };

  return (
    <Layout
      title="Belge Yükle"
      description="Farklı formatlarda belgelerinizi yükleyin, AI pipeline'ına hazırlayın."
      actions={
        <button
          onClick={() => navigate('/')}
          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Kontrol Paneline Dön
        </button>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg shadow-gray-200/40 transition hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:shadow-gray-900/40">
            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Belge Başlığı
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Örn: 2024 Finansal Rapor"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="category"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Kategori (opsiyonel)
                </label>
                <input
                  id="category"
                  name="category"
                  type="text"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="Örn: Finans"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Dosya Yükle
                </label>
                <label
                  htmlFor="file"
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  className="relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/60 px-6 py-12 text-center transition hover:border-blue-400 hover:bg-blue-50/50 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:border-blue-400 dark:hover:bg-blue-900/20"
                >
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Dosyayı sürükleyip bırakın veya seçin
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Desteklenen formatlar: PDF, PNG, JPG, JPEG, DOCX (maks. 10MB)
                    </p>
                  </div>
                  <input
                    id="file"
                    name="file"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.docx"
                    onChange={onFileInputChange}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </label>

                {file && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/30 dark:text-blue-200">
                    <p className="font-medium">{file.name}</p>
                    <p>{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                )}

                {filePreview && (
                  <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-gray-800">
                    <img
                      src={filePreview}
                      alt="Belge önizleme"
                      className="h-48 w-full object-contain bg-white dark:bg-gray-900"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  {state.error && (
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>
                  )}
                  {state.successMessage && (
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      {state.successMessage}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={state.isUploading || !file || !title.trim()}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  {state.isUploading ? 'Yükleniyor...' : 'Belgeyi Yükle'}
                </button>
              </div>
            </form>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-gray-200/40 dark:border-gray-800 dark:bg-gray-900 dark:shadow-gray-900/40">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Yükleme Durumu</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Sisteme yüklenen belgeler OCR, kategorizasyon ve özetleme işlemlerinden geçecektir.
              </p>
              <div className="mt-4 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all dark:bg-blue-400"
                  style={{ width: `${state.progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                {state.isUploading ? 'Belge yükleniyor...' : 'Hazır'}
              </p>
            </div>

            {state.document && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-lg shadow-green-200/40 dark:border-green-900/60 dark:bg-green-900/20 dark:shadow-green-900/40">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Belge başarıyla yüklendi!
                </p>
                <div className="mt-4 space-y-2 text-sm text-green-700/80 dark:text-green-200/80">
                  <p>
                    <span className="font-semibold">Başlık:</span> {state.document.title}
                  </p>
                  <p>
                    <span className="font-semibold">Dosya adı:</span> {state.document.filename}
                  </p>
                  <p>
                    <span className="font-semibold">Durum:</span> {state.document.status}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-lg shadow-gray-200/40 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:shadow-gray-900/40">
              <h3 className="font-semibold text-gray-900 dark:text-white">İpuçları</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Belge başlığı belgelerinizi daha hızlı bulmanızı sağlar.</li>
                <li>Kategori seçimi AI kategorizasyonunu destekler.</li>
                <li>PDF ve yüksek çözünürlüklü görseller daha iyi OCR sonuçları verir.</li>
              </ul>
            </div>
        </aside>
      </div>
    </Layout>
  );
}


