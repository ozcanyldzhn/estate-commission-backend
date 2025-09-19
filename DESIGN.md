# DESIGN.md — estate-commission-backend (backend/ dizinine uygun nihai sürüm)

## Soru-Cevap Özeti
- **Hangi sistem mimarisi ve veri modelini tasarladın?**: Hexagonal/Clean katmanlar; Node.js core `http` + TypeScript; Prisma/PostgreSQL. Uygulama içinde para minor (kuruş) tamsayı, DB'de Decimal. Temel modeller: `User`, `Transaction`, `CommissionShare`.
- **Bu problemi çözmek için nasıl bir mimari ve veri modeli düşündün?**: Controller (Zod) → Service (iş kuralları: lifecycle, komisyon) → Repository (port/adapter; Prisma). Minor⇄Decimal dönüşümü sadece repository adaptörlerinde.
- **Tasarımının gerekçesini açıkla.**: Test edilebilirlik, gevşek bağlılık, finansal doğruluk, ölçeklenebilirlik ve sade bağımlılıklar. Frameworksüz yapı çekirdek mantığı görünür kılar.
- **Düşünüp de reddettiğin alternatif yaklaşımlar oldu mu? Neden?**: Express/Nest (görev için ağır); float para (yuvarlama hatası); Event Sourcing (kapsam için ağır); tam in-memory (gerçek dünya için zayıf).
- **Tasarımının en riskli veya en zorlayıcı yönü neydi?**: Finansal doğruluk/yuvarlama ve `COMPLETED` aşamasında workflow tutarlılığı.
- **Bu riski azaltmak için hangi önlemleri aldın?**: Tüm aritmetik minor integer; dönüşümler tek noktada; `COMPLETED` aşamasında stage+pay yazımı tek DB transaction; kapsamlı unit testler.
- **Bu projeyi gerçek hayatta uygulasaydık, ilk neyi geliştirirdin/değiştirirdin?**: Kimlik doğrulama/Yetkilendirme (JWT)çoklu para birimi ve kur, aylık raporlar.
- **Neden bu değişiklikle başlardın?**: Güvenlik ve doğruluk üretim için temel, geniş kitleye hitap edebilme, düzenli rapor sayesinde erişebilirlik.

Bu doküman, **backend/** klasöründeki mevcut kod yapısıyla birebir uyumlu olacak şekilde
mimarimizi, veri modelimizi, iş kurallarını, akışları ve operasyonel kararları açıklar.
Çerçeve (framework) **yoktur**: yalnızca **Node.js core `http`** + **TypeScript** + **Prisma (PostgreSQL)**.
Doğrulamalar **Zod**, bağımlılık enjeksiyonu **tsyringe** (veya minimal el ile DI) ile yapılır.

> Mini Case hedefleri (özet): yaşam döngüsü takibi, tamamlanan işlemde komisyonun otomatik dağıtımı (%50 Ajans / %50 Ajan[lar]),
> her işlem için **net finansal breakdown** sağlanması, tasarım gerekçelerinin açıklanması.


---

## 1) Kapsam ve Hedefler

- Satış/kiralama **Transaction** kayıtlarını tutmak ve yaşam döngüsünü yönetmek:
  `AGREEMENT → EARNEST_MONEY → TITLE_DEED → COMPLETED`.
- Tamamlanan işlemde **toplam komisyon**u hesaplamak ve **%50 Ajans / %50 Ajan(lar)** kuralına göre paylaştırmak.
  - Tek ajan (listing === selling) ise ajan payının **tamamı** aynı kişiye.
  - İki farklı ajan varsa ajan payı **yarı yarıya**, **kalan kuruş listinge**.
- Her işlem için **breakdown**; her ajan için **earnings (kazanç)** raporu.
- Tüm para aritmetiğini **minor unit (kuruş)** **tamsayı** ile yapmak; DB’de **Decimal(18,2)** saklamak.


---

## 2) Yüksek Seviye Mimari

**Katmanlar** (hexagonal/clean yaklaşımı, frameworksüz):

```
node:http (server.ts)
  └─ http/router.ts                 # method+path eşleme, path param/regex
       └─ http/controllers/*        # DTO doğrulama + service çağrısı + HTTP yanıt
            └─ services/*           # iş kuralları (workflow, komisyon, rapor)
                 └─ repositories/*  # Prisma adaptörleri (DB I/O + dönüşümler)
                      └─ infra/prisma.ts  # PrismaClient tekil instance
```

- **Stateless**: Sunucu state tutmaz; kalıcılık DB’dedir.
- **HTTP yardımcıları**: `parseJsonBody`, `sendJson`, `notFound`, `methodNotAllowed`, güvenlik başlıkları & CORS.
- **Doğrulama**: Controller’da **Zod** → servisler daima **temiz DTO** alır.
- **DI**: `tsyringe` veya minimal el ile enjeksiyon; servis ve repo’lar arası gevşek bağlılık.


---

## 3) Veri Modeli (Prisma) ve Dönüşüm Stratejisi

Uygulama içinde **minor (kuruş)** **tamsayı** kullanıyoruz; DB’de **Decimal(18,2)** saklanıyor.
Dönüşümler **repository adaptörlerinde** tek noktadan yapılır.

### 3.1 Prisma şeması (özet, fikir vermesi için)

```prisma
// prisma/schema.prisma
enum PropertyType {
  RESIDENTIAL
  COMMERCIAL
  LAND
}

enum Stage {
  AGREEMENT
  EARNEST_MONEY
  TITLE_DEED
  COMPLETED
}

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // relations (örn. transactions)
}

model Transaction {
  id               String   @id @default(cuid())
  propertyId       String
  propertyType     PropertyType
  grossPrice       Decimal  @db.Decimal(18,2) // app: minor int
  commissionRate   Decimal  @db.Decimal(5,2) // app: bps (% = bps/100)
  commissionAmount Decimal  @db.Decimal(18,2) // app: minor int
  listingAgentId   String
  sellingAgentId   String
  stage            Stage
  currency         String   @default("TRY")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // relations: listingAgent/sellingAgent -> User (opsiyonel tanımlanabilir)
}

model CommissionShare {
  id            String   @id @default(cuid())
  transactionId String
  agentId       String
  role          String   // 'listing' | 'selling' | 'solo'
  amount        Decimal  @db.Decimal(18,2) // app: minor int
  currency      String   @default("TRY")
  createdAt     DateTime @default(now())

  @@index([transactionId])
  @@index([agentId])
}
```

### 3.2 Minor ⇄ Decimal dönüşümü

- **Yazarken**: `minor → (minor / 100).toString()` → Decimal
- **Okurken**: `Decimal string → parseFloat(x) * 100 → Math.round()` → minor

Bu sayede servis ve controller katmanında **asla float** kullanılmaz.


---

## 4) İş Kuralları (Domain)

### 4.1 Yaşam Döngüsü (Workflow)
Aşamalar **sıralı**dır:  
`AGREEMENT → EARNEST_MONEY → TITLE_DEED → COMPLETED`  
`advanceStage(id)` her çağrıda bir sonraki aşamaya taşır. `COMPLETED`’a geçerken komisyon dağıtımı tetiklenir.

### 4.2 Komisyon Politikası
- Toplam komisyonun **%50’si Ajans**, **%50’si Ajan(lar)**.
- **Tek ajan** (listing === selling): ajan payının tamamı aynı kişiye.
- **İki ajan**: ajan payı **yarı yarıya**; **kalan kuruş listinge**.

### 4.3 Hesaplama (minor int ile)
```
commission = round(grossMinor * bps / 10000)
agency     = floor(commission / 2)
agents     = commission - agency

if (samePerson) {
  listing = agents; selling = 0
} else {
  selling = floor(agents / 2)
  listing = agents - selling   // kalan kuruş listinge
}
```

### 4.4 Finansal Breakdown
`GET /api/transactions/:id/breakdown` → toplam komisyon (minor), Ajans payı, Ajan(lar) payı ve formatlı değerler döner.

### 4.5 Ajan Kazanç Raporu
`GET /api/agents/:agentId/earnings?from=&to=` → yalnız **COMPLETED** işlemlerden ilgili ajanın aldığı payların toplamı + işlem bazlı detaylar.


---

## 5) Uçtan Uca Akış: API → Controller → Service → Repository

### 5.1 HTTP & Router
- **server.ts**: `createServer(handler)`; güvenlik başlıkları (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`) ve **CORS** (dev’de `*`) eklenir.
- **router.ts**: method + path (regex) ile controller’lara yönlenir; path parametreleri `RegExp` ile çıkarılır.

### 5.2 Controller (Zod doğrulama)
- İstek `body` → `parseJsonBody(req)`
- DTO → `zodSchema.safeParse(body)`
- Hata varsa **400 VALIDATION_ERROR**; yoksa **service** çağrısı.
- Yanıt sözleşmesi **tek tip**: `{ success: true, data }` veya `{ success: false, error:{ code, message, details? } }`.

### 5.3 Services
- **TransactionService**:
  - `create(dto)`: `commissionRateBps` yoksa **1000 bps (%10)**; `stage='AGREEMENT'`; repo ile kaydet.
  - `advanceStage(id)`: sıradaki stage’e geç; `COMPLETED`’da komisyonu hesapla ve **DB transaction** içinde `CommissionShare` kayıtlarını **upsert** et.
  - `breakdown(id)`: `CommissionShare` üzerinden (veya hesapla) döküm ver.
- **AgentService**:
  - `getAgentEarnings(agentId, from?, to?)`: tamamlanmış işlemlerdeki payları tarih aralığına göre topla.

### 5.4 Repositories (Prisma adaptörleri)
- Minor ⇄ Decimal dönüşümlerini **tek noktadan** yapar.
- `advanceStage` için **Prisma `$transaction`** kullanılır:
  - `Transaction.stage` update
  - `CommissionShare` temizle + `createMany` ile ekle
- Bu atomiklik sayesinde “stage COMPLETED oldu ama paylar yazılmadı” gibi yarım durum oluşmaz.


---

## 6) HTTP API Sözleşmesi (özet)

### Sağlık
- `GET /health` → `{ success:true, data:{ status:'ok' } }`

### Users
- `POST /api/users`
  ```json
  { "name":"Ada Lovelace", "email":"ada@ex.com" }
  ```
- `GET /api/users?page=1&pageSize=20`

### Transactions
- `POST /api/transactions`
  ```json
  {
    "userId": "cuid", "propertyId": "EST-123", "propertyType": "RESIDENTIAL",
    "grossPrice": 12500000, "commissionRateBps": 1000,
    "currency": "TRY", "listingAgentId": "agent_1", "sellingAgentId": "agent_2"
  }
  ```
- `GET /api/transactions?userId=cuid&page=1&pageSize=20`
- `POST /api/transactions/:id/advance`
- `GET /api/transactions/:id/breakdown`

### Agents
- `GET /api/agents/:agentId/earnings?from=YYYY-MM-DD&to=YYYY-MM-DD`

> Not: Daha önce `Route not found` hatası aldıysan path’i tam olarak **/api/agents/:agentId/earnings** yazdığından emin ol.


---

## 7) Hata Yönetimi ve Validasyon

- **400 VALIDATION_ERROR**: Zod `issues` içerir.
- **404 NOT_FOUND**: route veya kaynak yok.
- **405 METHOD_NOT_ALLOWED**: path var, method desteklenmiyor.
- **500 INTERNAL**: beklenmeyen hata.
- **Tek tip JSON**: İstemciler için öngörülebilirlik sağlar.


---

## 8) Para Birimi ve Formatlama

- Varsayılan `TRY`. Aritmetik **minor** integer ile.
- Görsel sunum için: `Intl.NumberFormat('tr-TR', { style:'currency', currency:'TRY' }).format(minor/100)`


---

## 9) Test Stratejisi

- **Unit** (node:test): komisyon kuralları (tek/çift ajan, kuruş artığı listinge), workflow sırası, money helper, earnings toplama.
- **Integration (opsiyonel)**: canlı `/health` testi; demo akışı (create → advance → breakdown → earnings).
- **Node 20+**: `node --test --import tsx` (—loader depreke edildi).


---

## 10) Performans & Ölçeklenebilirlik

- **Stateless** API → yatay ölçek kolay.
- **Indeksler**: `transaction.stage`, `commission_share.agent_id`, `commission_share.transaction_id`, tarih alanları.
- **Sayfalama**: `page/pageSize` tüm listelerde.
- **DB Pool**: Prisma default pool ayarları; yoğunlukta pool size ayarlanabilir.


---

## 11) Güvenlik & Operasyon

- Güvenlik başlıkları (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection).
- CORS: dev’de `*`, prod’da **allowlist**.
- Logging: temel istek/yanıt ve hata kayıtları (PII içermeden).


---

## 12) Konfigürasyon & Dağıtım

- **ENV**:  
  - `DATABASE_URL` (PostgreSQL)  
  - `PORT` (varsayılan 3000)
- **Build**: `npm ci --include=dev && npm run generate && npm run build`
- **Start (prod)**: `prisma migrate deploy && node dist/server.js`
- Render gibi ortamlarda `start:prod` script’i ile migrate+run tek adımda yapılabilir.


---

## 13) Alternatifler (ve Neden Reddedildi?)

1. **Express/NestJS**: Hızlı geliştirme sağlar ama bu görevde **çekirdek mantığı** göstermek için frameworksüz tercih edildi.
2. **Float ile para hesabı**: Yuvarlama hataları → **minor integer** zorunlu.
3. **Event Sourcing**: Güçlü izlenebilirlik; bu kapsam için **ağır** kalır.
4. **Tam in-memory**: Prototip için iyi; gerçek dünya için **PostgreSQL + Prisma** seçildi.


---

## 14) En Riskli Kısım & Mitigasyon

- **Finansal doğruluk**: tüm aritmetik **minor integer** ile, dönüşüm adaptörleri tek noktada.
- **Atomiklik**: `COMPLETED` aşamasında **stage update + pay yazımı tek DB transaction**.
- **Workflow tutarlılığı**: sadece sıralı geçiş; completed’tan ileriye izin yok, tekrarlı çağrılarda guard.
- **Tarih & rapor doğruluğu**: earnings yalnız **COMPLETED** işlemlerden hesaplanır; tarih filtreleri DTO’da doğrulanır.


---

## 15) Gerçek Hayata Uyarlarsak İlk Yapılacaklar

1. **Kimlik Doğrulama & Yetkilendirme** (JWT + RBAC), multi-tenant ihtiyaçları.
2. **Audit Log** (kalıcı) + **observability** (metrics, tracing).
3. **Çoklu para birimi & kur (FX)**, raporlar için CSV/PDF export.
4. **Idempotency-Key** desteği (`advanceStage` ve dış sistem entegrasyonları için).
5. **OpenAPI/Swagger** dokümantasyonu.


---

## 16) Değerlendirme Kriterlerine Uyum (Mini Case)

- **Problem analizi & modelleme**: Transaction/CommissionShare net; kurallar tek noktada.  
- **Sistem tasarımı & mimari**: Hexagonal katmanlar, frameworksüz Node.js, Prisma adaptörleri.  
- **Kod kalitesi & bakımı**: Zod ile katı DTO, tek tip hata JSON’ı, unit testler.  
- **Kararlar & gerekçeler**: Alternatifler ve riskler açıklandı; operasyon & dağıtım net.


---

## Ek: Örnek Sayısal Breakdown (kontrol amaçlı)

- Brüt: **₺1.000,00** → bps=1000 (%10) → Komisyon **₺100,00**  
- Ajans **₺50,00**  
- Ajan(lar) **₺50,00**  
  - **Tek ajan** → ₺50,00 (listing=selling)  
  - **İki ajan** → ₺25,00 + ₺25,00 (kalan kuruş varsa **listinge**)
