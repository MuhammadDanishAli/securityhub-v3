import React from "react";
import { useNavigate } from "react-router-dom";
import "./Helpsuport.css";

function HelpSupport() {
  const navigate = useNavigate();

  return (
    <div className="help-support-container">
      <h1>🆘 Help & Support</h1>
      <button className="back-btn" onClick={() => navigate(-1)}>🔙 Go Back</button>

      <div className="section">
        <h2>❓ Frequently Asked Questions (FAQs)</h2>
        <details>
          <summary>🔹 How do I reset my PIN?</summary>
          <p>Go to the <strong>Security Settings</strong> page and update your PIN.</p>
        </details>

        <details>
          <summary>🔹 How do I enable Two-Factor Authentication (2FA)?</summary>
          <p>Navigate to <strong>Security Settings</strong> and toggle the 2FA switch.</p>
        </details>

        <details>
          <summary>🔹 My calls are not connecting. What should I do?</summary>
          <p>Ensure your internet connection is stable. If issues persist, restart the app.</p>
        </details>
      </div>

      <div className="section">
        <h2>⚙️ Troubleshooting</h2>
        <ul>
          <li>📶 <strong>Check Internet Connection:</strong> Make sure you are connected to Wi-Fi or mobile data.</li>
          <li>🔄 <strong>Restart the App:</strong> Close and reopen the app to refresh the connection.</li>
          <li>📞 <strong>Check Server Status:</strong> Visit our website for real-time updates.</li>
        </ul>
      </div>

      <div className="section">
        <h2>📞 Contact Support</h2>
        <p>Need further assistance? Contact our support team:</p>
        <ul>
          <li>📧 Email: <a href="mailto:support@voipapp.com">support@voipapp.com</a></li>
          <li>📞 Phone: +1 (800) 123-4567</li>
          <li>💬 Live Chat: Available on our website</li>
        </ul>
      </div>
    </div>
  );
}

export default HelpSupport;
