const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { spawn } = require("child_process");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// PDF yükleme için multer yapılandırması
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Statik olarak dosya sun
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Giriş
app.post("/api/login", (req, res) => {
  const { email, role } = req.body;
  if (email && role) {
    const trackingNumber = Math.floor(100000 + Math.random() * 900000);
    res.json({ success: true, role, takipNo: trackingNumber });
  } else {
    res.status(400).json({ success: false, message: "Geçersiz giriş" });
  }
});

// Mesaj gönderme
app.post("/api/yazar/mesaj", (req, res) => {
  const { email, mesaj } = req.body;
  if (!email || !mesaj) {
    return res.status(400).json({ message: "Email ve mesaj gerekli." });
  }

  const yeniMesaj = { email, mesaj, tarih: new Date().toISOString() };
  const dosyaYolu = path.join(__dirname, "messages.json");

  fs.readFile(dosyaYolu, "utf8", (err, data) => {
    let mevcutMesajlar = [];
    if (!err && data) {
      try {
        mevcutMesajlar = JSON.parse(data);
      } catch (e) {
        console.error("JSON parse hatası:", e);
      }
    }

    mevcutMesajlar.push(yeniMesaj);
    fs.writeFile(dosyaYolu, JSON.stringify(mevcutMesajlar, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ message: "Mesaj kaydedilemedi." });
      }
      res.json({ message: "Mesaj başarıyla gönderildi." });
    });
  });
});

// Alan tahmini fonksiyonu
function tahminEtAlan(kelimeler) {
  const alanlar = {
    yapayzeka: ["ai", "yapay zeka", "makine öğrenimi", "derin öğrenme"],
    yazilim: ["yazılım", "mühendisliği", "programlama"],
    veri: ["veri", "data", "istatistik"],
  };

  for (const alan in alanlar) {
    if (kelimeler.some((k) => alanlar[alan].some(a => k.toLowerCase().includes(a)))) {
      return alan;
    }
  }
  return "Bilinmiyor";
}

// Python ile spaCy üzerinden yazar ve kurum çıkarımı
function extractEntitiesWithPython(text) {
  return new Promise((resolve, reject) => {
    const process = spawn("python3", ["nlp/extract_entities.py"]);
    let result = "";

    process.stdout.on("data", (data) => {
      result += data.toString();
    });

    process.stderr.on("data", (data) => {
      console.error("Python Hatası:", data.toString());
    });

    process.on("close", (code) => {
      if (code !== 0) {
        return reject("Python script hatayla bitti.");
      }
      try {
        const parsed = JSON.parse(result);
        resolve(parsed);
      } catch (err) {
        reject("JSON parse hatası: " + err.message);
      }
    });

    process.stdin.write(text);
    process.stdin.end();
  });
}

// Makale yükleme
app.post("/api/upload", upload.single("pdf"), async (req, res) => {
  const email = req.body.email;
  if (!req.file || !email) {
    return res.status(400).json({ message: "Dosya ve email gerekli." });
  }

  const filePath = path.join(__dirname, "uploads", req.file.filename);
  const dataBuffer = fs.readFileSync(filePath);

  let anahtarKelimeler = [];
  let konu = "Bilinmiyor";
  let yazarlar = [];
  let kurumlar = [];

  try {
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;

    const keywordMatch = text.match(/(Keywords|Anahtar Kelimeler|Index Terms)[\s:]*([\s\S]{0,300})/i);
    if (keywordMatch) {
      anahtarKelimeler = keywordMatch[2]
        .split(/[,;]+/)
        .map(k => k.trim())
        .filter(k => k.length > 0);

      konu = tahminEtAlan(anahtarKelimeler);
    }

    const sonuc = await extractEntitiesWithPython(text);
    yazarlar = sonuc.yazarlar;
    kurumlar = sonuc.kurumlar;
  } catch (err) {
    console.error("Veri çıkarma hatası:", err);
  }

  const takipNo = Math.floor(100000 + Math.random() * 900000);
  const makale = {
    email,
    dosya: req.file.filename,
    takipNo,
    tarih: new Date().toISOString(),
    anahtarKelimeler,
    konu,
    yazarlar: yazarlar.length ? yazarlar : ["Belirtilmemiş"],
    kurumlar: kurumlar.length ? kurumlar : ["Belirtilmemiş"]
  };

  const dosyaYolu = path.join(__dirname, "makaleler.json");
  let mevcut = [];
  if (fs.existsSync(dosyaYolu)) {
    const data = fs.readFileSync(dosyaYolu, "utf8");
    mevcut = JSON.parse(data || "[]");
  }

  mevcut.push(makale);
  fs.writeFileSync(dosyaYolu, JSON.stringify(mevcut, null, 2));
  res.json({ message: "Dosya başarıyla yüklendi.", takipNo });
});

// Yazar makale durumu sorgulama
app.get("/api/yazar/makale-durumu", (req, res) => {
  const email = req.query.email;
  const dosyaYolu = path.join(__dirname, "durumlar.json");

  fs.readFile(dosyaYolu, "utf8", (err, data) => {
    if (err) return res.status(500).json({ message: "Durum okunamadı." });

    const durumlar = JSON.parse(data || "[]");
    const yazarDurum = durumlar.find((d) => d.email === email);
    res.json({ durum: yazarDurum?.durum || "Yükleme bekleniyor..." });
  });
});

// Hakem yorumları
app.get("/api/yazar/yorumlar", (req, res) => {
  const { email } = req.query;
  const yorumDosyasi = path.join(__dirname, "hakemYorumlari.json");

  fs.readFile(yorumDosyasi, "utf8", (err, data) => {
    if (err) return res.status(500).json({ message: "Yorum verisi okunamadı." });

    const yorumlar = JSON.parse(data);
    const kullaniciYorum = yorumlar.find((y) => y.email === email);
    res.json(kullaniciYorum || { yorum: "Henüz yorum yapılmadı.", sonuc: "Bekleniyor" });
  });
});

// Editör: Sistemdeki tüm makaleleri listeleme (makaleler.json üzerinden)
app.get("/api/editor/makaleler", (req, res) => {
  const dosyaYolu = path.join(__dirname, "makaleler.json");

  if (!fs.existsSync(dosyaYolu)) {
    return res.json([]);
  }

  fs.readFile(dosyaYolu, "utf8", (err, data) => {
    if (err) {
      console.error("Dosya okuma hatası:", err);
      return res.status(500).json({ message: "Makaleler alınamadı." });
    }

    try {
      const makaleler = JSON.parse(data || "[]");
      res.json(makaleler);
    } catch (e) {
      console.error("JSON parse hatası:", e);
      res.status(500).json({ message: "Veri işlenemedi." });
    }
  });
});

// Anonimleştirme için Python script çağırma
app.post("/api/anonimize", (req, res) => {
  const { dosyaAdi } = req.body;

  if (!dosyaAdi) {
    return res.status(400).json({ message: "Dosya adı gerekli." });
  }

  const python = spawn("python3", ["anonimize.py", dosyaAdi]);

  let output = "";
  let error = "";

  python.stdout.on("data", (data) => {
    output += data.toString();
  });

  python.stderr.on("data", (data) => {
    error += data.toString();
  });

  python.on("close", (code) => {
    if (code !== 0) {
      console.error("Anonimleştirme hatası:", error);
      return res.status(500).json({ message: "Anonimleştirme başarısız." });
    }

    console.log("Anonimleştirme tamamlandı:", output);
    res.json({ message: "Anonimleştirme başarılı", sonuc: output.trim() });
  });
});

// Anonimleştirme için Editör'den seçilen bilgilerle Python script çağırma
app.post("/api/editor/anonimize", (req, res) => {
  const { dosyaAdi, anonimBilgiler } = req.body;
  
  if (!dosyaAdi || !anonimBilgiler || anonimBilgiler.length === 0) {
    return res.status(400).json({ message: "Eksik parametre." });
  }

  const pythonProcess = spawn("python3", ["anonimize.py", dosyaAdi, ...anonimBilgiler]);

  let output = "";
  let error = "";

  pythonProcess.stdout.on("data", (data) => { output += data.toString(); });
  pythonProcess.stderr.on("data", (data) => { error += data.toString(); });

  pythonProcess.on("close", (code) => {
    if (code !== 0) {
      console.error("Anonimleştirme hatası:", error);
      return res.status(500).json({ message: "Anonimleştirme başarısız.", error });
    }

    const sonuc = JSON.parse(output);

    const anonimDosyaAdi = `anonimized-${dosyaAdi}`;
    const anonimDosyaYolu = path.join(__dirname, "anonimized", anonimDosyaAdi);
    fs.writeFileSync(anonimDosyaYolu, Buffer.from(sonuc.anonymized_pdf, 'base64'));

    res.json({
      message: "Anonimleştirme başarılı",
      anonimDosyaAdi
    });
  });
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
