"""
Database oluşturma scripti
"""

import asyncio
import asyncpg
from app.core.config import settings

async def create_database():
    """Database oluştur"""
    # Önce postgres database'ine bağlan
    # postgresql+asyncpg://user:pass@host:port/db -> postgresql://user:pass@host:port/db
    conn_string = settings.DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql://').replace('/doc-panel', '/postgres')
    
    try:
        # postgres database'ine bağlan
        conn = await asyncpg.connect(conn_string)
        
        # Database var mı kontrol et
        db_exists = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1", 'doc-panel'
        )
        
        if not db_exists:
            # Database oluştur
            await conn.execute('CREATE DATABASE "doc-panel"')
            print("✅ Database 'doc-panel' başarıyla oluşturuldu!")
        else:
            print("ℹ️  Database 'doc-panel' zaten mevcut.")
        
        await conn.close()
        
        # Şimdi doc-panel database'ine bağlan ve extension ekle
        doc_panel_url = settings.DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql://')
        conn = await asyncpg.connect(doc_panel_url)
        
        # pgvector extension'ı ekle (eğer yüklüyse)
        try:
            await conn.execute('CREATE EXTENSION IF NOT EXISTS vector')
            print("✅ pgvector extension eklendi!")
        except Exception as e:
            print(f"⚠️  pgvector extension eklenemedi (normal olabilir): {e}")
        
        await conn.close()
        print("✅ Database hazır!")
        
    except Exception as e:
        print(f"❌ Hata: {e}")
        print("\nManuel olarak şu komutu çalıştırabilirsiniz:")
        print('psql -U postgres -c \'CREATE DATABASE "doc-panel";\'')

if __name__ == "__main__":
    asyncio.run(create_database())

