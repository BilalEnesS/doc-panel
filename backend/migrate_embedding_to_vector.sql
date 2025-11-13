-- Embedding column'ı TEXT'ten vector tipine çevir
-- Bu script pgvector extension yüklendikten sonra çalıştırılmalı

-- Önce extension'ın yüklü olduğundan emin ol
CREATE EXTENSION IF NOT EXISTS vector;

-- Embedding column'ı vector tipine çevir
-- Eğer embedding NULL ise veya geçersiz format ise, NULL olarak kalacak
ALTER TABLE documents 
ALTER COLUMN embedding TYPE vector(1536) 
USING CASE 
    WHEN embedding IS NULL THEN NULL
    WHEN embedding = '' THEN NULL
    ELSE embedding::vector
END;

-- Index ekle (opsiyonel, performans için)
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

