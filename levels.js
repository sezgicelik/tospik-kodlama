// Bölüm tanımları. Yeni bölüm eklemek için bu diziye bir nesne ekle.
// Koordinatlar: x = sütun (soldan 0), y = satır (üstten 0).
// dir: kaplumbağanın başlangıçta baktığı yön ("up" | "down" | "left" | "right").
// mode: "live" = oka basınca hemen yürür · "plan" = önce diz, sonra Başlat · "edit" = bölüm editörü.
// preset: bölüm bu programla açılır (Hata Avı). Öğeler "right" gibi tek ok ya da {times, body:[...]} tekrar bloğu.
// repeat: true → 🔁 Tekrar düğmesi görünür.
// goals: sırayla toplanacak çilekler (tek çilek için goal da kullanılabilir).
// key / door: anahtar alınmadan kapıdan geçilmez.
window.UNITS = [
  { id: 1, name: "Yönler ve Sıra" },
  { id: 2, name: "Hata Avı" },
  { id: 3, name: "Tekrar Et" },
  { id: 4, name: "Önce Şunu Sonra Bunu" },
  { id: 5, name: "Kendi Bahçen" }
];

window.LEVELS = [
  // ---------- Ünite 1: Yönler ve Sıra ----------
  {
    id: 1, unit: 1,
    name: "İlk Adımlar",
    mode: "live",
    cols: 5, rows: 5,
    start: { x: 0, y: 2, dir: "right" },
    goal: { x: 3, y: 2 },
    obstacles: [],
    maxSteps: 8,
    intro: "Merhaba! Ben Tospik. Çileği çok seviyorum. Oklara bas, beni çileğe götür!",
    win: "Mmm, çok lezzetli! Teşekkürler!"
  },
  {
    id: 2, unit: 1,
    name: "Ağacın Etrafından",
    mode: "plan",
    cols: 5, rows: 5,
    start: { x: 0, y: 3, dir: "right" },
    goal: { x: 4, y: 3 },
    obstacles: [{ x: 2, y: 3 }, { x: 2, y: 4 }],
    maxSteps: 8,
    intro: "Bu sefer önce planını yap! Okları sıraya diz, sonra Başlat'a bas. Ağaçların içinden geçemem, etraflarından dolaştır.",
    win: "Harika! Planın işe yaradı, ağaçların etrafından dolandık!"
  },
  {
    id: 3, unit: 1,
    name: "Kıvrımlı Yol",
    mode: "plan",
    cols: 5, rows: 5,
    start: { x: 0, y: 4, dir: "right" },
    goal: { x: 4, y: 0 },
    obstacles: [
      { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 },
      { x: 3, y: 2 }, { x: 3, y: 3 }, { x: 3, y: 4 }
    ],
    maxSteps: 10,
    intro: "Çilek ta yukarıda! Yol kıvrım kıvrım. Önce hangi yöne, sonra hangi yöne gideceğimi iyi düşün.",
    win: "Vay canına, uzun bir yolculuktu! Sen harika bir yol göstericisin."
  },
  {
    id: 4, unit: 1,
    name: "En Kısa Yol",
    mode: "plan",
    cols: 5, rows: 5,
    start: { x: 0, y: 0, dir: "right" },
    goal: { x: 3, y: 3 },
    obstacles: [{ x: 1, y: 1 }, { x: 2, y: 2 }],
    maxSteps: 6,
    intro: "Bu sefer sadece 6 okun var! Çileğe giden en kısa yolu bul.",
    win: "Tam 6 adımda! Hiç ok harcamadan geldik!"
  },

  // ---------- Ünite 2: Hata Avı ----------
  {
    id: 5, unit: 2,
    name: "Bir Ok Yanlış",
    mode: "plan",
    cols: 5, rows: 5,
    start: { x: 0, y: 3, dir: "right" },
    goal: { x: 3, y: 1 },
    obstacles: [{ x: 2, y: 2 }, { x: 1, y: 1 }],
    maxSteps: 5,
    preset: ["right", "right", "right", "up", "left"],
    intro: "Programı ben yazdım ama bir ok yanlış! Başlat'a bas, nerede takıldığımı gör. Sonra yanlış oka dokunup sil, doğrusunu koy.",
    win: "Hatayı buldun! Sen gerçek bir hata avcısısın."
  },
  {
    id: 6, unit: 2,
    name: "Bir Ok Eksik",
    mode: "plan",
    cols: 5, rows: 5,
    start: { x: 0, y: 2, dir: "right" },
    goal: { x: 4, y: 2 },
    obstacles: [{ x: 1, y: 3 }, { x: 3, y: 1 }],
    maxSteps: 4,
    preset: ["right", "right", "right"],
    intro: "Bu programda bir şey eksik gibi. Başlat'a bas, ne olduğunu gör. Eksik oku ekle!",
    win: "Bir ok eksikti, sen tamamladın. Süper!"
  },
  {
    id: 7, unit: 2,
    name: "Bir Ok Fazla",
    mode: "plan",
    cols: 5, rows: 5,
    start: { x: 0, y: 0, dir: "down" },
    goal: { x: 2, y: 3 },
    obstacles: [{ x: 0, y: 4 }, { x: 1, y: 4 }],
    maxSteps: 6,
    preset: ["down", "down", "down", "down", "right", "right"],
    intro: "Bu sefer bir ok fazla! Başlat'a bas, nerede çarptığımı gör. Fazla oka dokunup sil.",
    win: "Fazla oku buldun ve sildin. Harikasın!"
  },

  // ---------- Ünite 3: Tekrar Et ----------
  {
    id: 8, unit: 3,
    name: "5 Kez Sağ",
    mode: "plan",
    repeat: true,
    cols: 6, rows: 5,
    start: { x: 0, y: 2, dir: "right" },
    goal: { x: 5, y: 2 },
    obstacles: [{ x: 2, y: 1 }, { x: 3, y: 3 }],
    maxSteps: 2,
    intro: "Çilek 5 adım uzakta ama sadece 2 yerin var! Tekrar düğmesine bas, sonra → oka bas, sonra 5 sayısına bas.",
    win: "Tek blokla 5 adım! Tekrar etmek çok pratik, değil mi?"
  },
  {
    id: 9, unit: 3,
    name: "Merdiven",
    mode: "plan",
    repeat: true,
    cols: 5, rows: 5,
    start: { x: 0, y: 4, dir: "right" },
    goal: { x: 3, y: 1 },
    obstacles: [{ x: 2, y: 4 }, { x: 0, y: 3 }, { x: 1, y: 2 }, { x: 3, y: 3 }],
    maxSteps: 2,
    intro: "Merdiven gibi çıkacağız: sağ, yukarı, sağ, yukarı... Tekrar bloğunun içine → ve ↑ koy, sonra 3 sayısına bas.",
    win: "Sağ-yukarı, sağ-yukarı, sağ-yukarı! Merdiveni tırmandık!"
  },
  {
    id: 10, unit: 3,
    name: "Tekrar ve Adım",
    mode: "plan",
    repeat: true,
    cols: 5, rows: 5,
    start: { x: 0, y: 3, dir: "right" },
    goal: { x: 4, y: 1 },
    obstacles: [{ x: 1, y: 0 }, { x: 3, y: 3 }, { x: 2, y: 2 }],
    maxSteps: 3,
    intro: "Sadece 3 yerin var. Bir tekrar bloğu ve birkaç tek ok ile çileğe ulaşabilir misin?",
    win: "Tekrar bloğu ve tek oklar birlikte! Çok akıllıca."
  },
  {
    id: 11, unit: 3,
    name: "İki Tekrar",
    mode: "plan",
    repeat: true,
    cols: 5, rows: 5,
    start: { x: 0, y: 4, dir: "up" },
    goal: { x: 4, y: 0 },
    obstacles: [{ x: 1, y: 3 }, { x: 2, y: 2 }, { x: 3, y: 1 }],
    maxSteps: 2,
    intro: "Çilek çapraz köşede ve sadece 2 yerin var. İki tekrar bloğu kullan: önce bir yöne 4 kez, sonra öbür yöne 4 kez.",
    win: "İki tekrar bloğuyla koca çayırı geçtik!"
  },

  // ---------- Ünite 4: Önce Şunu Sonra Bunu ----------
  {
    id: 12, unit: 4,
    name: "Anahtar ve Kapı",
    mode: "plan",
    repeat: true,
    cols: 5, rows: 5,
    start: { x: 0, y: 2, dir: "right" },
    goal: { x: 4, y: 2 },
    key: { x: 2, y: 0 },
    door: { x: 3, y: 2 },
    obstacles: [{ x: 3, y: 1 }, { x: 3, y: 3 }, { x: 1, y: 3 }],
    maxSteps: 8,
    intro: "Kapı kilitli! Önce yukarıdaki anahtarı al, sonra kapıdan geç.",
    win: "Anahtar kapıyı açtı! Önce anahtar, sonra kapı."
  },
  {
    id: 13, unit: 4,
    name: "İki Çilek",
    mode: "plan",
    repeat: true,
    cols: 5, rows: 5,
    start: { x: 0, y: 3, dir: "up" },
    goals: [{ x: 2, y: 0 }, { x: 4, y: 3 }],
    obstacles: [{ x: 1, y: 1 }, { x: 3, y: 2 }],
    maxSteps: 8,
    intro: "İki çilek var! Önce 1 numaralı çileği, sonra 2 numaralı çileği al.",
    win: "İkisini de sırayla topladın! Karnım tok."
  },
  {
    id: 14, unit: 4,
    name: "Büyük Macera",
    mode: "plan",
    repeat: true,
    cols: 5, rows: 5,
    start: { x: 0, y: 4, dir: "up" },
    goal: { x: 3, y: 3 },
    key: { x: 0, y: 1 },
    door: { x: 2, y: 0 },
    obstacles: [
      { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 1, y: 4 },
      { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }
    ],
    maxSteps: 4,
    intro: "Son büyük macera! Anahtar, kapı, ağaçlar ve sadece 4 yer. Tekrar bloklarını kullan.",
    win: "Bütün macerayı tamamladın! Sen artık gerçek bir kodlayıcısın!"
  },

  // ---------- Ünite 5: Kendi Bahçen ----------
  {
    id: 15, unit: 5,
    name: "Kendi Bahçen",
    mode: "edit",
    repeat: true,
    cols: 5, rows: 5,
    start: { x: 0, y: 2, dir: "right" },
    goal: { x: 4, y: 2 },
    obstacles: [],
    maxSteps: 8,
    intro: "Şimdi sıra sende! Ağaçları ve çileği istediğin yere koy, sonra Oyna'ya bas ve kendi bölümünü çöz.",
    win: "Kendi bahçeni tasarladın ve çözdün! Bir tane daha yapalım mı?"
  }
];
