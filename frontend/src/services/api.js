import axios from "axios";

const API_URL = "http://localhost:5000/api/email/send";

export const sendEmail = async (formData) => {
  return await axios.post(API_URL, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
