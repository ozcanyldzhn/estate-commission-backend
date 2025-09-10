# TASARIM DÖKÜMANI

## 1. Sistem Mimarisi & Veri Modeli

### Mimari Genel Bakış
Sistem, herhangi bir framework kullanmadan **clean / hexagonal architecture** yaklaşımıyla tasarlandı.  
Bu yaklaşım katmanları net ayırarak okunabilirlik ve genişletilebilirlik sağlıyor:

- **API Katmanı (Controller’lar)**  
  HTTP isteklerini karşılar, giriş/çıkış doğrulaması yapar, domain servislerini çağırır.  
  Örn: `transactions.controller.js`.

- **Domain Katmanı (İş Kuralları)**  
  İşin kalbi burada. Komisyon hesaplama, işlem akışı yönetimi, raporlama.  
  İçerik:  
  - `Money` yardımcı sınıfı (BigInt kuruş/penny bazlı).  
  - `CommissionPolicy` (kuralların stratejisi).  
  - Servisler: `WorkflowService`, `CommissionService`, `ReportingService`.

- **Infra Katmanı (Adaptörler)**  
  Dış dünya ile entegrasyon.  
  - `InMemoryStore` (basit repository, kalıcılık yok).  
  - `TransactionRepository`.  
  - `logger` (logları daha okunur hale getiriyor).

- **App Katmanı (Uygulama Başlatma)**  
  Dependency Injection, HTTP sunucu, router, middleware pipeline.

### Veri Modeli
- **Transaction (İşlem)**  
  - `id`  
  - `stage` (`AGREEMENT | EARNEST | TITLE_DEED | COMPLETED`)  
  - `totalFeeCents` (BigInt, penny bazlı)  
  - `currency` (varsayılan GBP)  
  - `listingAgentId`  
  - `sellingAgentId`  
  - `completedAt`

- **Agent (Danışman)**  
  Şimdilik sadece `id` (ileride isim, iletişim bilgisi eklenebilir).

- **CommissionShare (Komisyon Payı)**  
  - `transactionId`  
  - `recipientType` (`AGENCY | AGENT`)  
  - `recipientId`  
  - `amount` (BigInt penny)  
  - `percent`

- **AuditLog (İleride)**  
  - `entity`, `entityId`, `action`, `meta`, `at`

- **Money Yardımcısı**  
  - `"100.00"` → `10000n` (içeride)  
  - `10000n` → `"100.00"` (dışarıya)

### Düşünülen Alternatifler ve Reddedilenler
- **Katmansız tek dosya JSON** → çok hızlı ama test edilemez ve bakımı zor.  
- **ORM (Prisma/Sequelize)** → kapsam için fazla ağır, InMemory tercih edildi.  
- **Float sayılar** → finansal hesapta hatalı (0.1 + 0.2 ≠ 0.3). Yerine BigInt kuruş/penny.  
- **Event-sourcing** → denetim için iyi olurdu ama bu görev için fazla karmaşık.  

---

## 2. En Riskli / Zorlayıcı Noktalar

### a) Para Hassasiyeti
- **Risk**: Float ile yuvarlama hataları.  
- **Çözüm**: Tüm tutarlar **BigInt kuruş/penny** olarak tutuldu.  
- **Sonuç**: Her hesap %100 doğru, API’de string olarak döndürülüyor.

### b) Kuralların Değişebilirliği
- **Risk**: Komisyon oranları zamanla değişebilir.  
- **Çözüm**: `CommissionPolicy` sınıfı Strategy pattern ile tasarlandı.  
- **Sonuç**: Yeni politikalar kolayca eklenebilir.

### c) İşlem Akışının Doğruluğu
- **Risk**: Yanlış aşama geçişi (örn. direkt COMPLETED).  
- **Çözüm**: `WorkflowService` state machine yalnızca sırayla geçişe izin verir.  
- **Sonuç**: Süreç bütünlüğü korunur.

### d) Idempotency (Tekrarlanan İşlemler)
- **Risk**: Bir işlemin birden fazla kez tamamlanması çift kayıt yaratabilir.  
- **Çözüm**: Repo içinde guard eklendi, controller da stage kontrolü yapıyor.  
- **Sonuç**: Birden fazla complete çağrısı güvenli.

---

## 3. Gerçek Hayatta İlk Yapılacak Geliştirmeler

1. **Kalıcı Veritabanı**  
   InMemory yerine Postgres adapter, migration ve transaction desteği.

2. **Çoklu Danışman Desteği**  
   İki kişi yerine birden fazla danışmanın oransal paylaşımı.

3. **Çoklu Para Birimi**  
   İşlemlerde farklı currency desteği, kur dönüşümü (FX API).

4. **Kimlik Doğrulama & Yetkilendirme**  
   RBAC, JWT ile güvenlik.

5. **Denetim ve Gözlemlenebilirlik**  
   Audit log kalıcı saklama, Prometheus metrikleri, tracing.

6. **API Dokümantasyonu**  
   OpenAPI/Swagger entegrasyonu.

---

## 4. Değerlendirme Kriterlerine Yanıt

- **Problem Analizi & Modelleme**  
  - Transaction, Agent, CommissionShare net modellendi.  
  - Workflow state machine ile kurallar güvence altına alındı.  
  - Komisyon politikası tek bir noktada (`CommissionPolicy`).

- **Sistem Tasarımı & Mimari Düşünce**  
  - Katmanlı yapı, bağımlılıklar gevşek.  
  - Domain ile altyapı ayrıştı.  
  - Logger BigInt’i okunur gösteriyor.

- **Kod Kalitesi & Bakımı**  
  - Küçük ve odaklı dosyalar.  
  - Money helper ile yuvarlama tek yerde çözüldü.  
  - Testler domain + API’yi kapsıyor.

- **Karar Gerekçeleri**  
  - Alternatifler açıklandı (ORM, event-sourcing, float).  
  - Riskler belirlendi ve çözüm yolları anlatıldı.  
  - Gelecek geliştirmeler listelendi.

---

## 5. Test Yaklaşımı

- **Unit Testler**  
  - Komisyon senaryoları (tek danışman, iki danışman).  
  - Workflow geçişleri (doğru/yanlış).  
  - Money fonksiyonları.

- **Entegrasyon Testi**  
  - Tam akış (create → stage → complete → breakdown).  
  - Sonuçların kurallara uygunluğu doğrulandı.

- **Coverage**  
  - Satır %95, fonksiyon %92.  
  - Eksik kalanlar sadece hata durumları (örn. geçersiz input).

---

## 6. Örnek Dağılım (1000 GBP)

- **Acente (X)**: %50 = 500 GBP  
- **Listeleyen Danışman (Y)**: %25 = 250 GBP  
- **Satan Danışman (Z)**: %25 = 250 GBP  

Eğer Y = Z olsaydı → 500 GBP tek danışmana verilirdi.

---

## Sonuç
Bu tasarım, **frameworksüz Node.js** ile yalın ama sağlam bir mimari sundu.  
- Net iş kuralları,  
- Katmanlı yapı,  
- Yüksek test kapsamı,  
- Risk yönetimi ve geleceğe dair yol haritası.  

Gerçek dünyada hızla genişletilip kullanılabilir.
