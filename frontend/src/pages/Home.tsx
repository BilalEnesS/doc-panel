import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuthStore } from '../store/authStore';

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

export default function Home() {
  const user = useAuthStore((state) => state.user);

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
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-lg shadow-gray-200/40 transition hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900/80 dark:shadow-gray-900/40"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
              <span
                className={
                  stat.changeType === 'positive'
                    ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-600 dark:bg-green-500/10 dark:text-green-300'
                    : 'rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                }
              >
                {stat.change}
              </span>
            </div>
            <p className="mt-4 text-3xl font-semibold text-gray-900 dark:text-white">
              {stat.value}
            </p>
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-blue-500/40 via-transparent to-transparent transition group-hover:from-blue-500/70" />
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-lg shadow-gray-200/40 dark:border-gray-800 dark:bg-gray-900/80 dark:shadow-gray-900/40">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Akıllı belge yönetimine hoş geldiniz 🎯
              </h2>
              <p className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                Belgelerinizi yükleyin, OCR ile metne dönüştürün, AI ile kategorize edin ve özetleyin.
                Semantic search ve chatbot ile belgelerinizden hızlıca bilgi edinin.
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 p-[1px] shadow-lg shadow-blue-500/30">
              <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-5 py-3 text-sm font-medium text-blue-600 backdrop-blur dark:bg-gray-900/80 dark:text-blue-300">
                <span className="rounded-full bg-blue-100/60 p-2 text-blue-600 dark:bg-blue-500/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 5.25h16.5m-16.5 6h16.5m-16.5 6h16.5"
                    />
                  </svg>
                </span>
                Belgelerinizi güvenle yönetin
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.to}
                className="group rounded-2xl border border-gray-200 bg-white/70 p-6 transition hover:-translate-y-1 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/20 dark:border-gray-800 dark:bg-gray-900/70 dark:hover:border-blue-500/60"
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-full bg-blue-500/10 p-2 text-blue-600 transition group-hover:bg-blue-500 group-hover:text-white dark:bg-blue-500/10 dark:text-blue-300 dark:group-hover:bg-blue-500/70 dark:group-hover:text-white">
                    {action.icon}
                  </div>
                  <span className="text-sm font-semibold text-blue-600 transition group-hover:translate-x-1 dark:text-blue-400">
                    Başlat →
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                  {action.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-500/10 via-white to-blue-500/10 p-6 shadow-lg shadow-purple-200/40 dark:border-purple-500/20 dark:from-purple-500/10 dark:via-gray-900 dark:to-blue-500/10 dark:shadow-purple-900/40">
            <h3 className="text-base font-semibold text-purple-600 dark:text-purple-300">
              AI Pipeline Durumu
            </h3>
            <div className="mt-4 space-y-3">
              {[
                { label: 'OCR İşleme', progress: 65 },
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
              Son AI Aktiviteleri
            </h3>
            <ul className="mt-4 space-y-3">
              {[
                {
                  title: 'Finans Raporu 2024',
                  status: 'Özet hazırlandı',
                  time: '3 dakika önce',
                },
                {
                  title: 'Sözleşme V2',
                  status: 'OCR tamamlandı',
                  time: '12 dakika önce',
                },
                {
                  title: 'Satış Analizi',
                  status: 'Semantic index güncellendi',
                  time: '18 dakika önce',
                },
              ].map((item) => (
                <li
                  key={item.title}
                  className="rounded-2xl border border-gray-100 bg-white/60 p-4 transition hover:border-blue-500/40 dark:border-gray-800 dark:bg-gray-900/60 dark:hover:border-blue-500/40"
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>
                  <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">{item.status}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.time}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </Layout>
  );
}


