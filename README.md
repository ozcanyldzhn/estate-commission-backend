# estate-commission-backend

Mini Case gereksinimlerini karşılayan **komisyon yönetimi backend**.  
Teknoloji: **Node.js (yalnızca core `http`)** + **TypeScript** + **Prisma** + **PostgreSQL**.  
Mimari yaklaşım: **Clean / Hexagonal Architecture** — domain kuralları merkezde, dış dünya (API, DB, log) adaptörlerle ayrıştırıldı.

---

## 🚀 Özellikler

- İşlem yaşam döngüsü:  
  `AGREEMENT → EARNEST_MONEY → TITLE_DEED → COMPLETED`
- Komisyon politikası:  
  - %50 Ajans  
  - %50 Ajan(lar) (tek ajan → tamamı, iki ajan → eşit, kuruş farkı listinge)
- Tam **finansal breakdown** endpoint’i
- Ajan bazlı **kazanç raporu** (tarih aralığı filtreli)
- Tüm finansal hesaplar **minor unit (kuruş/penny)** BigInt ile; DB’de Decimal(18,2)
- Frameworksüz, minimal router + middleware pipeline
- Unit & Integration testleriyle iş kuralları doğrulanıyor

---

## 📦 Kurulum

### Gereksinimler
- Node.js 20+
- PostgreSQL (örneğin Supabase)

### Adımlar

```bash
# 1. Bağımlılıklar
npm ci

# 2. Ortam Değişkenleri
cp .env.example .env
# .env içine:
# DATABASE_URL="postgresql://user:pass@host:5432/dbname"
# PORT=3000

# 3. Prisma
npx prisma generate
npx prisma migrate dev -n init        # yerel için
# prod: npx prisma migrate deploy

# 4. Geliştirme
npm run dev

# 5. Build & Run
npm run build
npm start
```

---

## 🌐 API

### Sağlık Kontrolü
- `GET /health` → `{ success:true, data:{ status:'ok' } }`

### Kullanıcılar
- `POST /api/users`  
  Body: `{ "name":"Ada Lovelace", "email":"ada@ex.com" }`
- `GET /api/users?page=1&pageSize=20`

### İşlemler
- `POST /api/transactions`
```json
{
  "userId": "cuid",
  "propertyId": "EST-123",
  "propertyType": "RESIDENTIAL",
  "grossPrice": 12500000,       // minor (kuruş) => 125000.00 TRY
  "commissionRateBps": 1000,    // opsiyonel, default %10
  "currency": "TRY",
  "listingAgentId": "agent_1",
  "sellingAgentId": "agent_2"
}
```

- `GET /api/transactions?userId=cuid&page=1&pageSize=20`

- `POST /api/transactions/:id/advance`  
  Aşamayı bir ileri taşır → `COMPLETED` olduğunda komisyon dağıtılır.

- `GET /api/transactions/:id/breakdown`  
  Örnek:
```json
{
  "success": true,
  "data": {
    "id": "tx_123",
    "stage": "COMPLETED",
    "breakdown": {
      "currency": "TRY",
      "totalCommissionMinor": 62500,
      "agency": 31250,
      "agents": [
        { "agentId": "agent_listing", "role": "listing", "amountMinor": 15625 },
        { "agentId": "agent_selling", "role": "selling", "amountMinor": 15625 }
      ],
      "formatted": {
        "total": "₺625,00",
        "agency": "₺312,50",
        "agentsTotal": "₺312,50"
      }
    }
  }
}
```

### Danışmanlar
- `GET /api/agents/:id/earnings?from=2025-01-01&to=2025-12-31`  
  Örnek:
```json
{
  "success": true,
  "data": {
    "agentId": "agent_1",
    "period": { "from": "2025-01-01", "to": "2025-12-31" },
    "currency": "TRY",
    "totalAgentEarningsMinor": 500000,
    "totalAgentEarningsMajor": 5000,
    "totalAgentEarningsFormatted": "₺5.000,00",
    "byTransaction": [
      {
        "transactionId": "tx_123",
        "role": "listing",
        "earnedMinor": 15625,
        "earnedMajor": 156.25,
        "earnedFormatted": "₺156,25",
        "createdAt": "2025-09-10T12:00:00.000Z"
      }
    ]
  }
}
```

---

## 💰 Komisyon & Para Yönetimi

- **Varsayılan oran:** %10 (1000 bps)  
- **Tüm hesaplamalar:** minor integer (kuruş) → hata yok  
- **DB dönüşümü:** minor ↔ Decimal(18,2)  
- **Money helper:** string ↔ BigInt ↔ formatted

---

## ⚠️ Hata Sözleşmesi

- 400 → `VALIDATION_ERROR` (Zod detayları)  
- 404 → `NOT_FOUND`  
- 405 → `METHOD_NOT_ALLOWED`  
- 500 → `INTERNAL`

Tüm cevap formatı:
```json
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Route not found" } }
```

---

## 🧪 Testler

### Komutlar
```jsonc
// package.json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "test": "node --test --import tsx",
    "generate": "prisma generate"
  }
}
```

Çalıştır:
```bash
npm run test
```

### Kapsam
- **Unit**: Komisyon hesaplama, workflow geçişleri, Money helper  
- **Integration**: create → advance → complete → breakdown, earnings  
- **Coverage**: Satır >%90, fonksiyon >%90

---

## 🚀 Dağıtım

- **Render.com**  
  - Build: `npm ci --include=dev && npm run generate && npm run build`  
  - Start: `npx prisma migrate deploy && npm start`
- **ENV**: `DATABASE_URL`, `PORT`  
- **CORS**: dev → `*`, prod → allowlist

---

## 📊 Mini Case Kriterlerine Yanıt

- **Lifecycle takibi** ✅  
- **Otomatik komisyon dağıtımı** ✅  
- **Net breakdown & earnings raporu** ✅  
- **Hexagonal/clean architecture + Prisma/Postgres** ✅  
- **Risk analizi & mitigasyon (BigInt, workflow state machine)** ✅  
- **Karar gerekçeleri & alternatifler** → `DESIGN.md` ✅  
- **Testler & README** ✅

---

## Sonuç

Bu backend:  
- Frameworksüz Node.js ile **hexagonal mimari**,  
- %100 doğru finansal hesaplama (BigInt kuruş bazlı),  
- Açık iş kuralları (%50 ajans / %50 ajan),  
- Prisma + Postgres ile kalıcılık,  
- Yüksek test kapsamı,  
- Geleceğe dair net geliştirme yol haritası.  

Gerçek hayata uyarlanabilir, güvenilir bir çözüm.
