# 2048 — Mobil Oyun

GitHub'da en çok klonlanan oyunlardan biri olan **2048**'in, dokunmatik kaydırma (swipe) kontrolüyle mobil öncelikli bir sürümü.

## Oynanış

- Mobilde parmakla kaydır (yukarı/aşağı/sol/sağ), masaüstünde ok tuşları veya WASD kullan.
- Aynı değerdeki iki kutucuk yan yana gelince birleşir ve değerleri toplanır.
- **2048** değerine ulaşan kutucuğu oluşturunca kazanırsın — dilersen oyuna devam edebilirsin.
- Hamle kalmayınca oyun biter. En yüksek skor tarayıcıda saklanır.

## Geliştirme

```bash
npm install
npm run dev        # geliştirme sunucusu
npm run build       # prodüksiyon derlemesi (dist/)
npm run typecheck   # TypeScript tip kontrolü
```

## Teknoloji

Saf TypeScript + [Vite](https://vitejs.dev) — framework yok, tek bağımlılık derleme aracı. `manifest.webmanifest` sayesinde telefonda "Ana Ekrana Ekle" ile bağımsız bir mobil uygulama gibi açılır.
