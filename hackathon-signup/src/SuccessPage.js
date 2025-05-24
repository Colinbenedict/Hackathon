import React from "react";
import Confetti from "react-confetti";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * SuccessPage
 * This page shows the user their unique Sign Up Code after registration, with confetti and a button to return home.
 */

// --- Code Dictionary ---
// Confetti: Fun animation to celebrate success.
// useLocation: React Router hook to access navigation state (where we get the sign up code).
// useNavigate: React Router hook to programmatically go to another page.
// Sign Up Code: Unique code for editing/deleting registration later.
// Clipboard: Where copied text is stored temporarily on your device.

function SuccessPage() {
  // Get the sign up code from navigation state
  const location = useLocation();
  const navigate = useNavigate();
  const signUpCode = location.state?.signUpCode || "";

  // If no code, redirect to home (prevents direct access)
  React.useEffect(() => {
    if (!signUpCode) {
      navigate("/", { replace: true });
    }
  }, [signUpCode, navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: 40 }}>
      {/* Confetti animation for celebration */}
      <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={250} recycle={false} />
      <div style={{
        background: '#fffbe6',
        border: '2px solid #FFD700',
        borderRadius: 10,
        padding: '18px 24px',
        margin: '18px 0',
        textAlign: 'center',
        boxShadow: '0 2px 8px #FFD70033',
        color: '#565EAA',
        fontWeight: 600,
        fontSize: 20,
        position: 'relative',
        maxWidth: 420,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
        <div style={{ fontSize: 22, marginBottom: 8 }}>🎉 Your Sign Up Code:</div>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: 28,
            background: '#f7f7f7',
            borderRadius: 6,
            padding: '8px 18px',
            display: 'inline-block',
            letterSpacing: 2,
            marginBottom: 8,
            userSelect: 'all',
            cursor: 'pointer',
          }}
          title="Click to copy"
          onClick={() => {
            navigator.clipboard.writeText(signUpCode);
          }}
        >
          {signUpCode}
          <span style={{ fontSize: 16, marginLeft: 8, color: '#FFD700' }}>📋</span>
        </div>
        <div style={{ fontSize: 16, marginTop: 10, color: '#444' }}>
          <strong>Save this code!</strong> You'll need it to edit your registration later.
        </div>
        <button
          className="vizient-button"
          style={{ marginTop: 24, fontSize: 18, padding: '10px 32px', borderRadius: 8 }}
          onClick={() => navigate("/")}
        >
          Return to Home
        </button>
      </div>
      {/* --- Beginner Tips --- */}
      <div style={{ marginTop: 32, color: '#888', fontSize: 15 }}>
        <strong>Tip:</strong> Click the code to copy it to your clipboard.<br />
        If you lose your code, you won't be able to edit or delete your registration!
      </div>
    </div>
  );
}

export default SuccessPage; 