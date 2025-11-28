import { useState } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
  // Manual verification
  const [licenseNumber, setLicenseNumber] = useState("");
  const [manualResult, setManualResult] = useState(null);
  const [loadingManual, setLoadingManual] = useState(false);

  // Upload scan
  const [imageFile, setImageFile] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);

  // ---------------- MANUAL VERIFY ----------------
  const handleVerify = async () => {
    if (!licenseNumber.trim())
      return alert("Please enter a license number");

    setLoadingManual(true);
    setManualResult(null);

    try {
      const resp = await axios.post("http://localhost:4000/verify", {
        licenseNumber,
      });
      setManualResult(resp.data);
    } catch {
      setManualResult({ error: "Backend not reachable" });
    }

    setLoadingManual(false);
  };

  // ---------------- UPLOAD & SCAN ----------------
  const handleFileScan = async () => {
    if (!imageFile) return alert("Please choose an image");

    const form = new FormData();
    form.append("image", imageFile);

    setScanLoading(true);
    setScanResult(null);

    try {
      const resp = await axios.post("http://localhost:4000/scan", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setScanResult(resp.data);
    } catch (err) {
      setScanResult(
        err.response?.data || { error: "Failed to reach backend" }
      );
    }

    setScanLoading(false);
  };

  // ---------------- RESULT CARD ----------------
  const ResultCard = ({ data }) => {
    if (!data) return null;

    const isError =
      data.error || data.status === "not_detected" || data.status === "not_found";

    let className = "result-card result-neutral";

    if (data.status === "valid") className = "result-card result-valid";
    else if (data.status === "suspicious") className = "result-card result-warning";
    else if (isError) className = "result-card result-error";

    return (
      <div className={className}>
        <h3>
          {data.error
            ? "Error"
            : data.status === "valid"
            ? "✔ Valid License"
            : data.status === "suspicious"
            ? "⚠ Suspicious"
            : data.status === "not_found"
            ? "✖ Not Found"
            : "⚠ Not Detected"}
        </h3>

        <p>{data.message || data.error}</p>

        {data.extracted && (
          <>
            <p>
              <b>Detected CM/L:</b> {data.extracted.licenseNumber || "N/A"}
            </p>
            <p>
              <b>Standard:</b> {data.extracted.standardCode || "N/A"}
            </p>
          </>
        )}

        {data.data && (
          <>
            <p>
              <b>Company:</b> {data.data.company_name}
            </p>
            <p>
              <b>Product:</b> {data.data.product_name}
            </p>
            <p>
              <b>Standard:</b> {data.data.standard_code}
            </p>
          </>
        )}

        {data.rawText && (
          <details>
            <summary>Show OCR Text</summary>
            <pre>{data.rawText}</pre>
          </details>
        )}
      </div>
    );
  };

  return (
    <div className="app-container">
      <h1>🛡️ ISI Mark Licence Checker</h1>
      <p className="subtitle">
        Verify CM/L numbers manually or scan an image of the ISI label.
      </p>

      {/* -------- Manual Check -------- */}
      <div className="card">
        <h2>1. Manual Verification</h2>
        <input
          type="text"
          placeholder="Enter CM/L Number (e.g., CM/L-1234567)"
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
        />

        <button className="btn-primary" onClick={handleVerify}>
          Verify
        </button>

        {loadingManual && <p>Checking...</p>}

        <ResultCard data={manualResult} />
      </div>

      {/* -------- Upload Scan -------- */}
      <div className="card">
        <h2>2. Upload Image for OCR Scan</h2>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
        />

        <button className="btn-success" onClick={handleFileScan}>
          Upload & Scan
        </button>

        {scanLoading && <p>Scanning...</p>}

        <ResultCard data={scanResult} />
      </div>

      <footer className="footer">
        Built for BIS Hackathon • ISI Compliance Scanner
      </footer>
    </div>
  );
}
