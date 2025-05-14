import React, { useState } from "react";
import axios from "axios";

function YazarDashboard() {
  const [email, setEmail] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleMesajGonder = async () => {
    try {
      const response = await axios.post("http://localhost:3001/api/yazar/mesaj", {
        email,
        mesaj,
      });
      setFeedback("Mesaj başarıyla gönderildi.");
      setMesaj("");
    } catch (error) {
      setFeedback("Mesaj gönderilirken hata oluştu.");
    }
  };

  return (
    <div className="container">
      <h2>Yazar Paneli</h2>

      <div className="form-group">
        <label>Email adresiniz</label>
        <input
          type="email"
          className="form-control"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="form-group mt-3">
        <label>Editöre Mesaj</label>
        <textarea
          className="form-control"
          rows="4"
          value={mesaj}
          onChange={(e) => setMesaj(e.target.value)}
        ></textarea>
      </div>

      <button className="btn btn-primary mt-3" onClick={handleMesajGonder}>
        Mesaj Gönder
      </button>

      {feedback && <div className="alert alert-info mt-3">{feedback}</div>}
    </div>
  );
}

export default YazarDashboard;