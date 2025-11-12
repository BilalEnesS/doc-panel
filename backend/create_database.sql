-- PostgreSQL database oluşturma scripti
-- Kullanım: psql -U postgres -f create_database.sql

-- Database oluştur (eğer yoksa)
SELECT 'CREATE DATABASE "doc-panel"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'doc-panel')\gexec

-- Database'e bağlan
\c "doc-panel"

-- pgvector extension'ı ekle (eğer yüklüyse)
CREATE EXTENSION IF NOT EXISTS vector;

-- Başarı mesajı
SELECT 'Database "doc-panel" başarıyla oluşturuldu!' AS message;

