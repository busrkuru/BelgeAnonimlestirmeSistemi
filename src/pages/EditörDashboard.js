import React, { useState, useEffect } from "react";
import axios from "axios";

function EditörDashboard() {
  const [makaleListesi, setMakaleListesi] = useState([]);
  const [hata, setHata] = useState("");
  const [anonimSecenekler, setAnonimSecenekler] = useState({
    yazar: true,
    kurum: true,
  });

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/editor/makaleler")
      .then((res) => setMakaleListesi(res.data))
      .catch((err) => {
        console.error("İstek hatası:", err);
        setHata("Makaleler yüklenirken hata oluştu.");
      });
  }, []);

  const handleCheckboxChange = (e) => {
    setAnonimSecenekler({
      ...anonimSecenekler,
      [e.target.name]: e.target.checked,
    });
  };

  const anonimlestir = (dosyaAdi) => {
    const anonimBilgiler = Object.keys(anonimSecenekler).filter(key => anonimSecenekler[key]);
  
    axios
      .post("http://localhost:3001/api/editor/anonimize", {
        dosyaAdi,
        anonimBilgiler,
      })
      .then((res) => {
        alert("Anonimleştirme başarılı! Sonuç: " + JSON.stringify(res.data));
      })
      .catch((err) => {
        alert("Anonimleştirme sırasında hata oluştu.");
        console.error("Anonimleştirme hatası:", err);
      });
  };

  return (
    <div className="container">
      <h2>Editör Paneli</h2>
      <h4>Yüklenen Makaleler</h4>

      {hata && <div className="alert alert-danger">{hata}</div>}

      <div className="mb-3 mt-4">
        <label>
          <input
            type="checkbox"
            name="yazar"
            checked={anonimSecenekler.yazar}
            onChange={handleCheckboxChange}
          />{" "}
          Yazar Ad-Soyad
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            name="kurum"
            checked={anonimSecenekler.kurum}
            onChange={handleCheckboxChange}
          />{" "}
          Kurum Bilgileri
        </label>
      </div>

      <ul className="list-group mt-3">
        {makaleListesi.map((m, index) => (
          <li key={index} className="list-group-item">
            <strong>E-posta:</strong> {m.email} <br />
            <strong>Dosya:</strong> {m.dosya} <br />
            <strong>Yükleme Tarihi:</strong>{" "}
            {new Date(m.tarih).toLocaleString()} <br />
            <strong>Takip No:</strong> {m.takipNo} <br />
            <strong>Anahtar Kelimeler:</strong>{" "}
            {m.anahtarKelimeler?.join(", ") || "Yok"} <br />
            <strong>Konu:</strong> {m.konu || "Bilinmiyor"} <br />
            <strong>Yazarlar:</strong> {m.yazarlar || "Belirtilmemiş"} <br />
            <strong>Kurumlar:</strong> {m.kurumlar || "Belirtilmemiş"} <br />
            <a
              href={`http://localhost:3001/uploads/${m.dosya}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-primary mt-2 me-2"
            >
              Makaleyi Görüntüle
            </a>
            <button
              className="btn btn-sm btn-warning mt-2"
              onClick={() => anonimlestir(m.dosya)}
            >
              Anonimleştir
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default EditörDashboard;