// services/epaService.js
import axios from 'axios';

const API_URL = 'http://localhost:3001/epa';

export const getEpas = async () => {
  const { data } = await axios.get(API_URL, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return data;
};

export const createEpa = async ({ nombre_epa, descripcion, imagen_referencia }) => {
  const formData = new FormData();
  formData.append('nombre_epa', nombre_epa);
  formData.append('descripcion', descripcion);
  if (imagen_referencia) formData.append('imagen_referencia', imagen_referencia);

  const { data } = await axios.post(API_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return data;
};
