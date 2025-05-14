import React, { useState, useEffect } from "react";
import { getMakaleList } from "../utils/api";

function HakemDashboard() {
  const [makaleler, setMakaleler] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchMakaleler();
  }, []);

  const fetchMakaleler = async () => {
    try {
      const response = await getMakaleList();
      setMakaleler(response.data);
    } catch (error) {
      setMessage("Makaleler yüklenirken hata oluştu.");
    }
  };

  return (
    <div className="container">
      <h2>Hakem Paneli</h2>
      <h4>Değerlendirilecek Makaleler</h4>
      <ul className="list-group">
        {makaleler.map((makale) => (
          <li key={makale._id} className="list-group-item">
            {makale.baslik} - <button className="btn btn-info">İncele</button>
          </li>
        ))}
      </ul>
      {message && <p className="alert alert-info mt-3">{message}</p>}
    </div>
  );
}

export default HakemDashboard;