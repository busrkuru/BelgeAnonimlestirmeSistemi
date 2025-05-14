import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

function Login() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("yazar");
  const [takipNo, setTakipNo] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:3001/api/login", { email, role });
      localStorage.setItem("userRole", role);
      setTakipNo(response.data.takipNo); // Takip numarasını state'e kaydet
      setError(null); // Hata varsa temizle

      // 2 saniye sonra dashboard sayfasına yönlendir
      setTimeout(() => {
        navigate(`/${role}`);
      }, 2000);
    } catch (error) {
      setError("Giriş başarısız!");
    }
  };

  return (
    <div className="container mt-5">
      <h2>Giriş Yap</h2>
      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          className="form-control"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="form-group mt-3">
        <label>Rol Seç</label>
        <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="yazar">Yazar</option>
          <option value="editor">Editör</option>
          <option value="hakem">Hakem</option>
        </select>
      </div>
      <button className="btn btn-primary mt-3" onClick={handleLogin}>
        Giriş Yap
      </button>

      {/* Takip numarası gösterimi */}
      {takipNo && (
        <div className="alert alert-success mt-4">
          Takip Numaranız: <strong>{takipNo}</strong>
        </div>
      )}

      {/* Hata mesajı */}
      {error && (
        <div className="alert alert-danger mt-4">
          {error}
        </div>
      )}
    </div>
  );
}

export default Login;