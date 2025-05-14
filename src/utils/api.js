import axios from "axios";

const API_URL = "http://localhost:3000/api"; // Backend adresini buraya yaz

export const loginUser = async (email, role) => {
  return await axios.post(`${API_URL}/login`, { email, role });
};

export const uploadMakale = async (file) => {
  const formData = new FormData();
  formData.append("pdf", file);
  return await axios.post(`${API_URL}/upload/pdf`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getMakaleList = async () => {
  return await axios.get(`${API_URL}/makaleler`);
};

export const anonymizeMakale = async (dosya_yolu) => {
  return await axios.post(`${API_URL}/anonimle/pdf`, { dosya_yolu });
};