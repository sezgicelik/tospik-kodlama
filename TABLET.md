# Tablette Açma (Samsung Galaxy Tab S6)

Üç yol var. Hızlıdan kalıcıya doğru:

## 1. Aynı Wi-Fi (en hızlı, kurulum yok)

1. Bilgisayarda `basla.bat` çift tıkla. Pencerede tablet için adres yazar, örn. `http://192.168.1.9:8765`.
2. Tabletteki Chrome'a bu adresi yaz.
3. Windows ilk seferde "Python'a ağ izni verilsin mi?" diye sorarsa **Özel ağlar** kutusunu işaretleyip izin ver. Sormazsa ve tablet bağlanamazsa, Windows Güvenlik Duvarı'nda 8765 portuna gelen bağlantıya izin ver:

   ```
   netsh advfirewall firewall add rule name="Tospik 8765" dir=in action=allow protocol=TCP localport=8765
   ```
   (Yönetici olarak açılmış komut satırında.)

Oyun tamamen çalışır. Eksik olan tek şey: Chrome "Ana ekrana ekle" teklifini http üzerinden göstermez, çevrimdışı çalışmaz. Bilgisayar kapanınca oyun da kapanır.

## 2. USB kablo + Chrome port yönlendirme (tam PWA, "ana ekrana ekle" çalışır)

Tablet, bilgisayardaki sunucuyu `localhost` olarak görür; Chrome bunu güvenli sayar.

**Tablette bir kez:**
1. Ayarlar → Tablet hakkında → Yazılım bilgileri → **Derleme numarası**na 7 kez dokun (Geliştirici seçenekleri açılır).
2. Ayarlar → Geliştirici seçenekleri → **USB hata ayıklama** aç.

**Bilgisayarda her seferinde:**
1. `basla.bat` çalışır durumda olsun.
2. Tableti kabloyla bağla. Tablette "USB hata ayıklamaya izin verilsin mi?" çıkar → **Bu bilgisayara her zaman izin ver** + Tamam.
3. Bilgisayardaki Chrome'da `chrome://inspect/#devices` aç.
4. **Port forwarding** düğmesi → satıra `8765` ve `localhost:8765` yaz → **Enable port forwarding** işaretle → Done.
5. Tabletteki Chrome'a `http://localhost:8765` yaz.
6. Chrome menüsü (⋮) → **Ana ekrana ekle** (veya "Uygulamayı yükle"). Tospik ikonu ana ekrana gelir, tam ekran açılır.

Kurulumdan sonra kablo takılıyken açınca güncel sürüm yüklenir; kablo yokken de service worker sayesinde son önbelleğe alınan sürüm çevrimdışı açılır.

## 3. İnternete koymak (kalıcı, kablosuz, her cihazdan)

GitHub Pages gibi ücretsiz bir https adrese yüklenirse tablet doğrudan `https://...` adresinden açar, "ana ekrana ekle" çalışır, bilgisayarın açık olması gerekmez. Bunun için projeyi git deposuna alıp GitHub'a göndermek gerekir; istendiğinde yapılır.

## Sorun giderme

- **Adres açılmıyor:** `basla.bat` penceresi açık mı? Tablet ve bilgisayar aynı Wi-Fi'de mi? Güvenlik duvarı (yukarıda).
- **"Port 8765 kullanımda" hatası:** Başka bir Tospik sunucusu zaten açık (ör. Claude'un önizleme sunucusu). Onu kapat ya da tabletten o açık olanı kullan.
- **Ses çıkmıyor:** Tablette ilk dokunuştan sonra ses açılır (tarayıcı kuralı). Sağ üstteki hoparlör kapalı olmasın.
- **Sesli okuma yok:** Samsung tablette Ayarlar → Genel yönetim → Metin okuma → Türkçe ses paketi yüklü olmalı (Google Metin Okuma, Türkçe).
