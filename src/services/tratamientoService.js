import axios from 'axios';

const API_URL = 'http://localhost:3001/tratamientos';

export const getTratamientos = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const createTratamiento = async (tratamiento) => {
  const res = await axios.post(API_URL, tratamiento);
  return res.data;
};
