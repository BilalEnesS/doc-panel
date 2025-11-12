# GitHub Kullanım Rehberi

Bu rehber, Intelligent Document Management System projesi için GitHub kullanımını açıklar.

## 1. GitHub Repository Oluşturma

### Adımlar:

1. **GitHub'a giriş yapın**: https://github.com adresine gidin ve giriş yapın

2. **Yeni repository oluşturun**:
   - Sağ üst köşedeki "+" butonuna tıklayın
   - "New repository" seçeneğini seçin
   - Repository adı: `doc-panel` veya `intelligent-document-management`
   - Açıklama: "Intelligent Document Management System - AI-powered document management platform"
   - Visibility: **Private** veya **Public** (tercihinize göre)
   - **ÖNEMLİ**: "Initialize this repository with a README" seçeneğini **İŞARETLEMEYİN** (zaten README'miz var)
   - "Create repository" butonuna tıklayın

3. **Local repository'yi bağlayın**:
   ```bash
   # Proje klasörüne gidin
   cd C:\Users\HP\OneDrive\Masaüstü\doc-panel
   
   # Git'i başlatın (eğer henüz başlatılmadıysa)
   git init
   
   # GitHub repository URL'inizi ekleyin (örnek)
   git remote add origin https://github.com/KULLANICI_ADINIZ/doc-panel.git
   
   # İlk commit'i yapın
   git add .
   git commit -m "feat: initial project setup with backend and frontend structure"
   
   # Main branch'e push edin
   git branch -M main
   git push -u origin main
   ```

## 2. Branch Stratejisi

### Branch Oluşturma

Her yeni özellik için ayrı branch oluşturun:

```bash
# Yeni branch oluştur ve geçiş yap
git checkout -b feature/auth

# Veya (daha yeni Git versiyonlarında)
git switch -c feature/auth
```

### Branch Listesi

Proje için kullanılacak branch'ler:

- `main` - Stabil ve deploy edilebilir kod
- `feature/auth` - Kullanıcı kayıt ve giriş
- `feature/document-upload` - Belge yükleme ve storage
- `feature/ocr-processing` - OCR işleme ve metin çıkarma
- `feature/document-management` - Belge listeleme, görüntüleme, silme
- `feature/semantic-search` - Vector embeddings ve semantic search
- `feature/ai-categorization` - AI ile belge kategorizasyonu
- `feature/ai-summarization` - Belge özetleme
- `feature/ai-chatbot` - Belge soru-cevap chatbot
- `feature/admin-crud` - Admin CRUD modülü
- `feature/tests` - Backend ve frontend testleri
- `feature/docker-setup` - Docker Compose setup

## 3. Commit Kuralları

### Commit Mesaj Formatı

```
<type>(<scope>): <subject>

<body> (opsiyonel)

<footer> (opsiyonel)
```

### Commit Type'ları

- `feat`: Yeni özellik
- `fix`: Hata düzeltme
- `docs`: Dokümantasyon
- `style`: Kod formatlama (fonksiyonalite değişikliği yok)
- `refactor`: Kod refactoring
- `test`: Test ekleme/düzeltme
- `chore`: Build, config, dependency güncellemeleri

### Örnek Commit Mesajları

```bash
git commit -m "feat(auth): add signup endpoint with email validation"
git commit -m "feat(doc): add document upload with file validation"
git commit -m "feat(ocr): integrate Tesseract OCR for image processing"
git commit -m "fix(search): fix vector search query performance"
git commit -m "test(doc): add unit tests for document service"
git commit -m "docs(readme): update installation instructions"
```

### Önemli Kurallar

- ✅ **Anlamlı ve küçük commit'ler** yapın
- ✅ Her commit **tek bir özelliği** eklemeli
- ❌ **"Big bang" commit yapmayın** (tüm değişiklikleri tek seferde commit etmeyin)

## 4. Pull Request (PR) İşlemi

### PR Oluşturma

1. **Branch'inizi push edin**:
   ```bash
   git push origin feature/auth
   ```

2. **GitHub'da PR oluşturun**:
   - GitHub repository sayfanıza gidin
   - "Compare & pull request" butonuna tıklayın
   - Veya "Pull requests" sekmesinden "New pull request" seçin

3. **PR Açıklaması** (zorunlu bölümler):
   ```markdown
   ## Problem Tanımı
   Kullanıcı kayıt ve giriş sistemi eksikti.
   
   ## Çözüm Özeti
   - JWT tabanlı authentication sistemi eklendi
   - Signup ve login endpoint'leri oluşturuldu
   - Password hashing için bcrypt kullanıldı
   
   ## Test Notları
   - Signup endpoint test edildi
   - Login endpoint test edildi
   - JWT token doğrulama test edildi
   
   ## Değişen Dosyalar
   - backend/app/api/v1/auth.py
   - backend/app/services/auth_service.py
   - backend/app/models/user.py
   - frontend/src/pages/Login.tsx
   - frontend/src/pages/Signup.tsx
   ```

4. **PR'ı gözden geçirme için hazırlayın**:
   - En az 1 reviewer onayı gerekir
   - CI/CD pipeline'ın başarılı olması gerekir
   - Code review sonrası merge edilir

### PR Merge

- PR'lar **sadece main branch'e** merge edilir
- Merge işlemi genellikle "Squash and merge" veya "Rebase and merge" ile yapılır
- Merge sonrası branch silinebilir

## 5. Günlük Çalışma Akışı

### Yeni Özellik Geliştirme

```bash
# 1. Main branch'ten güncel kodu al
git checkout main
git pull origin main

# 2. Yeni feature branch oluştur
git checkout -b feature/document-upload

# 3. Değişiklikleri yap ve commit et
git add .
git commit -m "feat(doc): add document upload endpoint"

# 4. Branch'i push et
git push origin feature/document-upload

# 5. GitHub'da PR oluştur
```

### Değişiklikleri Güncelleme

```bash
# Main branch'teki yeni değişiklikleri al
git checkout main
git pull origin main

# Feature branch'e geri dön
git checkout feature/document-upload

# Main'deki değişiklikleri merge et
git merge main

# Veya rebase yap (daha temiz geçmiş için)
git rebase main
```

## 6. Sık Kullanılan Git Komutları

```bash
# Durumu kontrol et
git status

# Değişiklikleri göster
git diff

# Tüm değişiklikleri stage'e al
git add .

# Belirli dosyaları stage'e al
git add backend/app/api/v1/auth.py

# Commit yap
git commit -m "feat(auth): add login endpoint"

# Branch'leri listele
git branch

# Remote branch'leri listele
git branch -r

# Branch değiştir
git checkout feature/auth

# Son commit'i düzenle (henüz push edilmediyse)
git commit --amend

# Son commit mesajını değiştir
git commit --amend -m "yeni mesaj"

# Remote repository'yi kontrol et
git remote -v

# Remote'dan güncellemeleri al
git fetch origin

# Remote'dan güncellemeleri al ve merge et
git pull origin main
```

## 7. Sorun Giderme

### Commit'i geri alma (henüz push edilmediyse)

```bash
# Son commit'i geri al ama değişiklikleri koru
git reset --soft HEAD~1

# Son commit'i geri al ve değişiklikleri sil
git reset --hard HEAD~1
```

### Push edilmiş commit'i geri alma

```bash
# Yeni bir commit ile değişiklikleri geri al
git revert HEAD

# Veya (dikkatli kullanın, ekip çalışmasında sorun çıkarabilir)
git reset --hard HEAD~1
git push --force origin feature/branch-name
```

## 8. GitHub Actions (CI/CD)

Proje geliştirme sürecinde GitHub Actions ile otomatik testler ekleyeceğiz. Şimdilik bu bölüm boş bırakılmıştır.

## 9. İpuçları

- ✅ **Sık sık commit yapın** - Küçük ve anlamlı commit'ler
- ✅ **Branch isimlerini açıklayıcı tutun** - `feature/auth` gibi
- ✅ **PR açmadan önce test edin** - Local'de çalıştığından emin olun
- ✅ **PR açıklamasını doldurun** - Reviewer'lar için önemli
- ❌ **Main branch'e direkt push yapmayın** - Her zaman PR ile
- ❌ **Force push yapmayın** (gerekmedikçe) - Ekip çalışmasında sorun çıkarır

## 10. İlk Kurulum Sonrası

Proje kurulumu tamamlandıktan sonra:

```bash
# Git'i başlat
git init

# .gitignore dosyası zaten oluşturuldu, kontrol et
cat .gitignore

# İlk commit
git add .
git commit -m "feat: initial project setup with backend and frontend structure"

# GitHub repository'nizi ekleyin (yukarıdaki adımları takip edin)
git remote add origin https://github.com/KULLANICI_ADINIZ/doc-panel.git

# Push edin
git branch -M main
git push -u origin main
```

---

**Not**: GitHub kullanımı hakkında daha fazla bilgi için [GitHub Docs](https://docs.github.com/) sayfasını ziyaret edebilirsiniz.

