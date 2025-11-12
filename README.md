# Intelligent Document Management System

**Proje Başlangıç Zamanı:** 202511130111

## Proje Özeti

Intelligent Document Management System, kullanıcıların belge yükleyip yönetebileceği, AI ile analiz edebileceği ve semantic search yapabileceği bir platformdur.

### Kullanıcı Akışı

1. Kullanıcı kayıt olur veya giriş yapar
2. Belge yükler (PDF, image, docx)
3. Sistem OCR ile metin çıkarır
4. AI ile belgeyi kategorize eder ve özetler
5. Semantic search ile belge arayabilir
6. AI chatbot ile belge hakkında soru sorabilir

## Teknoloji Stack

### Backend
- FastAPI (Python)
- PostgreSQL + pgvector (vector search için)
- Redis (cache ve queue için)
- Tesseract OCR (belge metin çıkarma)
- OpenAI API (embeddings, summarization, chatbot)
- LangChain (document Q&A)
- Hugging Face (kategorizasyon, NLP)

### Frontend
- React + TypeScript
- Tailwind CSS
- Vite
- React Router DOM
- Axios (API client)
- React Query (data fetching)
- Zustand (state management)

## Proje Yapısı

```
doc-panel/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   └── v1/           # API v1 endpoints
│   │   ├── core/              # Core components (config, database)
│   │   ├── models/            # Database models
│   │   ├── repositories/      # Repository layer (data access)
│   │   └── services/          # Business logic layer
│   ├── alembic.ini            # Alembic configuration
│   ├── Dockerfile
│   ├── main.py                # FastAPI application entry point
│   ├── requirements.txt       # Python dependencies
│   └── env.example            # Environment variables example
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── store/             # Zustand state management
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utility functions
│   │   └── hooks/             # Custom React hooks
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml          # Docker Compose configuration
├── GITHUB_GUIDE.md            # GitHub kullanım rehberi
└── README.md
```

## Mimari Yaklaşım

### Backend Mimari
- **Layered Architecture**: API → Service → Repository → Database
- **OOP Principles**: Class-based services ve repositories
- **Dependency Injection**: FastAPI dependency system
- **Async/Await**: Tüm database işlemleri async

### Frontend Mimari
- **Component-Based**: React component yapısı
- **State Management**: Zustand ile global state
- **Data Fetching**: React Query ile server state yönetimi
- **Type Safety**: TypeScript ile tip güvenliği

## Veri Modeli

### User
- `id`: Primary key
- `email`: Unique, indexed
- `password_hash`: Hashed password
- `role`: Enum (user | admin)
- `created_at`, `updated_at`: Timestamps

### Document
- `id`: Primary key
- `user_id`: Foreign key to User
- `title`, `filename`, `file_path`: File information
- `file_type`: Enum (pdf | image | docx)
- `file_size`: Bytes
- `category`: AI categorized category
- `summary`: AI generated summary
- `extracted_text`: OCR extracted text
- `embedding`: Vector embedding (pgvector)
- `status`: Enum (uploading | processing | completed | failed)
- `created_at`, `updated_at`: Timestamps

### DocumentCategory
- `id`: Primary key
- `name`: Unique category name
- `description`: Category description
- `created_at`: Timestamp

### DocumentSearchHistory
- `id`: Primary key
- `user_id`: Foreign key to User
- `query`: Search query
- `results_count`: Number of results
- `created_at`: Timestamp

### ChatMessage
- `id`: Primary key
- `user_id`: Foreign key to User
- `document_id`: Foreign key to Document
- `message`: User message
- `response`: AI response
- `created_at`: Timestamp

## Kurulum

### Gereksinimler
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16+ (pgvector extension)
- Redis 7+
- Tesseract OCR

### Backend Kurulumu

```bash
cd backend

# Virtual environment oluştur
python -m venv venv

# Virtual environment'ı aktif et
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Dependencies yükle
pip install -r requirements.txt

# Environment variables ayarla
cp env.example .env
# .env dosyasını düzenle

# Database migration (Alembic ile)
alembic upgrade head
```

### Frontend Kurulumu

```bash
cd frontend

# Dependencies yükle
npm install

# Development server başlat
npm run dev
```

### Docker ile Kurulum

```bash
# Tüm servisleri başlat
docker-compose up -d

# Logları görüntüle
docker-compose logs -f

# Servisleri durdur
docker-compose down
```

## Geliştirme Durumu

### ✅ Tamamlanan
- [x] Proje yapısı oluşturuldu
- [x] Backend temel yapı (FastAPI, models, database)
- [x] Frontend temel yapı (React, TypeScript, Vite)
- [x] Docker Compose yapılandırması
- [x] GitHub rehberi

### 🚧 Devam Eden
- [ ] Authentication sistemi
- [ ] Document upload
- [ ] OCR processing
- [ ] Semantic search
- [ ] AI entegrasyonları

### 📋 Planlanan
- [ ] Document management
- [ ] Admin paneli
- [ ] Testler
- [ ] CI/CD pipeline

## Sonraki Adımlar

1. **Authentication**: Kullanıcı kayıt ve giriş sistemi
2. **Document Upload**: Belge yükleme ve storage
3. **OCR Processing**: Tesseract OCR entegrasyonu
4. **Semantic Search**: Vector embeddings ve search
5. **AI Features**: Categorization, summarization, chatbot

Detaylı geliştirme planı için case taslağına bakınız.

