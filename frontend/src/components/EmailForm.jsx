import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { sendEmail } from "../services/api";

const EmailForm = () => {
  const [subject, setSubject] = useState("Application for Software Developer Role");
  const [template, setTemplate] = useState(`
    <p>Dear [Recruiter's Name],</p>
    <p>I hope you are doing well...</p>
    <p><b>Edit here...</b></p>
    <p>Best regards,<br/>Your Name</p>
  `);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0); // Progress percentage
  const [timer, setTimer] = useState(10); // Countdown timer (10s)
  const [showOverlay, setShowOverlay] = useState(false); // Overlay state
  const [emailSent, setEmailSent] = useState(false); // To track email sending status
  let progressInterval;
  let countdownInterval;

  const handleUpload = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowOverlay(true);
    setProgress(0);
    setTimer(30);
    setEmailSent(false);

    const formData = new FormData();
    formData.append("subject", subject);
    formData.append("template", template);
    formData.append("resume", file);

    try {
      const response = await fetch("http://localhost:5000/api/email/send", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.estimatedTime) {
        setTimer(data.estimatedTime);
      }

      // Start Progress Bar
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 1000);

      // Start Countdown Timer
      countdownInterval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 0) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Wait for the backend to process emails
      await new Promise((resolve) => setTimeout(resolve, data.estimatedTime * 1000));

      setLoading(false);
      setShowOverlay(false);
      setProgress(100);
      setEmailSent(true);
      alert("Emails sent successfully!");
    } catch (error) {
      alert("Failed to send emails. Please try again.");
      setLoading(false);
      setShowOverlay(false);
      clearInterval(progressInterval);
      clearInterval(countdownInterval);
    }
  };

  // Handle Cancel Request
  const handleCancel = async () => {
    await fetch("http://localhost:5000/api/email/cancel", { method: "POST" });

    setLoading(false);
    setShowOverlay(false);
    setProgress(0);
    setTimer(10);

    clearInterval(progressInterval);
    clearInterval(countdownInterval);
  };

  return (
    <div className="email-form">
      <label>Subject:</label>
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject"
      />
      <ReactQuill theme="snow" value={template} onChange={setTemplate} />
      <input type="file" accept=".pdf,.docx" onChange={handleUpload} />
      {file && <p>{file.name}</p>}

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? <span className="loader"></span> : "Send Emails"}
      </button>

      {/* Overlay for process indication */}
      {showOverlay && (
        <div className="overlay">
          <div className="overlay-content">
            <h2>Process Undergoing, Please Wait...</h2>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
            <p>{progress}% Completed</p>
            <p>Estimated Time: {timer} sec</p>
            <button className="cancel-button" onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailForm;
