import React, { useState, useEffect } from "react";
import axios from "axios";

function YazarDashboard() {
  const [mesaj, setMesaj] = useState("");
  const [email, setEmail] = useState(localStorage.getItem("userEmail") || "");
  const [mesajDurumu, setMesajDurumu] = useState("");
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [takipNo, setTakipNo] = useState("");
  const [makaleDurumu, setMakaleDurumu] = useState("");
  const [yorum, setYorum] = useState("");
  const [sonuc, setSonuc] = useState("");

  useEffect(() => {
    const no = localStorage.getItem("takipNo");
    if (no) setTakipNo(no);

    if (email) {
      axios
        .get(`http://localhost:3001/api/yazar/makale-durumu?email=${email}`)
        .then((res) => setMakaleDurumu(res.data.durum))
        .catch(() => setMakaleDurumu("Durum alınamadı."));

      axios
        .get(`http://localhost:3001/api/yazar/yorumlar?email=${email}`)
        .then((res) => {
          setYorum(res.data.yorum);
          setSonuc(res.data.sonuc);
        })
        .catch(() => {
          setYorum("Yorum alınamadı.");
          setSonuc("Sonuç alınamadı.");
        });
    }
  }, [email]);

  const mesajGonder = async () => {
    try {
      const response = await axios.post("http://localhost:3001/api/yazar/mesaj", {
        email,
        mesaj,
      });
      setMesajDurumu(response.data.message);
      setMesaj("");
    } catch (error) {
      setMesajDurumu("Mesaj gönderilemedi.");
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !email) {
      setUploadMessage("Lütfen dosya ve e-posta giriniz.");
      return;
    }
    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("email", email);

    try {
      const response = await axios.post("http://localhost:3001/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setUploadMessage(response.data.message);
      if (response.data.takipNo) {
        localStorage.setItem("takipNo", response.data.takipNo);
        setTakipNo(response.data.takipNo);
      }
    } catch (error) {
      setUploadMessage("Yükleme sırasında bir hata oluştu.");
    }
  };

  return (
    <div className="container">
      <h2>Yazar Paneli</h2>

      <div className="form-group mt-4">
        <label>E-posta</label>
        <input
          type="email"
          className="form-control"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="form-group mt-3">
        <label>Mesaj</label>
        <textarea
          className="form-control"
          value={mesaj}
          onChange={(e) => setMesaj(e.target.value)}
        />
      </div>

      <button className="btn btn-primary mt-3" onClick={mesajGonder}>
        Mesaj Gönder
      </button>

      {mesajDurumu && <p className="mt-3 alert alert-info">{mesajDurumu}</p>}

      <hr className="mt-5" />

      <div className="form-group mt-4">
        <label>PDF Yükle</label>
        <input type="file" className="form-control" onChange={handleFileChange} />
        <button className="btn btn-primary mt-2" onClick={handleUpload}>
          Yükle
        </button>
        {uploadMessage && <p className="alert alert-info mt-2">{uploadMessage}</p>}
      </div>

      {takipNo && (
        <div className="alert alert-secondary mt-3">
          Takip Numaranız: <strong>{takipNo}</strong>
        </div>
      )}

      {makaleDurumu && (
        <div className="alert alert-warning mt-3">
          <strong>Makale Durumu:</strong> {makaleDurumu}
        </div>
      )}

      <hr className="mt-5" />
      <h5>Hakem Değerlendirmesi</h5>
      <div className="alert alert-light">
        <strong>Yorum:</strong> {yorum}
        <br />
        <strong>Sonuç:</strong> {sonuc}
      </div>

      <h5 className="mt-4">Mesajlarınız</h5>
      <ul className="list-group">
        <li className="list-group-item">📨 Editöre gönderdiğiniz mesaj: {mesaj}</li>
        <li className="list-group-item">📬 Cevap bekleniyor...</li>
      </ul>
    </div>
  );
}

export default YazarDashboard;