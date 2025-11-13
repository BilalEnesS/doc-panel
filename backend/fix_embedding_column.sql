-- Embedding column'ı TEXT'ten vector tipine çevir
-- pgvector extension zaten yüklü

-- Önce extension'ın yüklü olduğundan emin ol
CREATE EXTENSION IF NOT EXISTS vector;

-- Embedding column'ı vector tipine çevir
-- Embedding'ler array formatında saklanmış: [-0.007523200009018183, ...]
ALTER TABLE documents 
ALTER COLUMN embedding TYPE vector(1536) 
USING CASE 
    WHEN embedding IS NULL THEN NULL
    WHEN embedding = '' THEN NULL
    ELSE embedding::vector
END;

-- Index ekle (performans için)
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Kontrol et
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents' AND column_name = 'embedding';

