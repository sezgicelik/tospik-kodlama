# Tospik ile Kodlama — Yol Haritası

6 yaş için kaplumbağa yönlendirmeli kodlama oyunu (PWA). Okul kodlama dersine destek.

## Durum (2026-10-12)

- [x] 5 ünite, 15 bölüm tamam; hepsi tarayıcıda baştan sona oynanarak doğrulandı
- [x] Ünite 1 Yönler ve Sıra (1–4): bölüm 1 `live` (oka basınca yürür), sonrası `plan` (önce diz, sonra Başlat)
- [x] Ünite 2 Hata Avı (5–7): bölüm hazır hatalı programla açılır (`preset`), hatalı adım kırmızı kalır
- [x] Ünite 3 Tekrar Et (8–11): 🔁 bloğu (içine en fazla 3 ok) + 2–5 sayı; çalışırken geri sayar, içteki ok vurgulanır
- [x] Ünite 4 Önce Şunu Sonra Bunu (12–14): anahtar 🔑 / kapı 🚪, numaralı sıralı çilekler
- [x] Ünite 5 Kendi Bahçen (15): editör (ağaç/çilek/Tospik/sil), Oyna ↔ Düzenle, bahçe localStorage'da kalır
- [x] Üst bar: ünite adı + o ünitenin rozetleri (tıklayınca bölüme gider) + ‹ › ünite okları
- [x] Sesler (WebAudio) + sesli okuma (tr-TR) + ses kapatma; konfeti; ilerleme localStorage
- [x] PWA: manifest + service worker (v2) + ikonlar; tablet (16:10) yatay/dikey kaydırmasız düzen
- [ ] Yayın: https adres (GitHub Pages) → tablete "ana ekrana ekle" kablosuz
- [ ] Kaplumbağa adı/karakteri çocuğun tercihine göre özelleştirme
- [ ] Sonraya: koşul ("çiçek varsa"), ileri/sola dön/sağa dön komut tipi (okul Bee-Bot kullanıyorsa)

## Ders planı (uygulandı)

| Ünite | Kavram | Bölümler | Mekanik |
|---|---|---|---|
| 1 Yönler ve Sıra | Sıralama, yön | 1 Alışma (live) · 2 Ağaç etrafı · 3 Kıvrımlı Yol · 4 En Kısa Yol (6 slot) | oklar |
| 2 Hata Avı | Debugging | 5 Bir ok yanlış · 6 Bir ok eksik · 7 Bir ok fazla | `preset` |
| 3 Tekrar Et | Döngü | 8 5 Kez Sağ (2 slot) · 9 Merdiven (→↑ ×3) · 10 Tekrar + adım · 11 İki tekrar | `repeat: true` |
| 4 Önce Şunu Sonra Bunu | Alt hedefler | 12 Anahtar → kapı · 13 İki çilek sırayla · 14 Büyük Macera (4 slot) | `key`, `door`, `goals[]` |
| 5 Kendi Bahçen | Yaratıcılık | 15 Editör | `mode: "edit"` |

Çözüm notları (ebeveyn için):
- 3: → → ↑ ↑ ↑ ↑ → → · 4: → → → ↓ ↓ ↓ · 5: son ← yerine ↑ · 6: bir → ekle · 7: bir ↓ sil
- 8: 🔁 → ×5 · 9: 🔁 →↑ ×3 · 10: 🔁 → ×4, ↑, ↑ · 11: 🔁 ↑ ×4, 🔁 → ×4
- 12: ↑ ↑ → → ↓ ↓ → → · 13: 🔁 ↑ ×3, 🔁 → ×2, 🔁 ↓ ×3, 🔁 → ×2 · 14: 🔁 ↑ ×4, 🔁 → ×3, 🔁 ↓ ×3

Klavye (bilgisayarda test): oklar, R = tekrar bloğu, 2–5 = sayı, Enter = Başlat, Backspace = geri al.

## Nasıl çalıştırılır

`basla.bat` çift tıkla (Python ile yerel sunucu, http://localhost:8765 açılır; pencerede tablet adresi de yazar).
Tablet kurulumu: `TABLET.md`.

## Dosyalar

- `index.html` — sayfa iskeleti + kaplumbağa SVG tanımı
- `style.css` — tema (resimli kitap / çıkartma görünümü), tablet/telefon düzeni
- `app.js` — oyun mantığı (modlar, tekrar blokları, anahtar/kapı, sıralı çilek, editör, ses, PWA kaydı)
- `levels.js` — ünite ve bölüm verileri (yeni bölüm buraya eklenir)
- `manifest.json`, `sw.js`, `icons/` — PWA
- `tools/make-icons.ps1` — ikonları yeniden üretir
- `TABLET.md` — tablette açma / kurma kılavuzu

## Resume noktası

Tüm müfredat (15 bölüm) bitti ve test edildi. Kullanıcı geri bildirimi bekleniyor. Olası sıradaki işler: GitHub Pages yayını, karakter özelleştirme, Bee-Bot tipi komutlar, zorluk ayarı (adım hızı).
