import React, { useRef, useState } from "react";

/**
 * HypeSongPlayer
 * Fun button to play/pause the hackathon hype song!
 * - Button says "Hackathon Hype Jam"
 * - Button changes color and text when playing
 * - Audio is hidden (no controls)
 */
function HypeSongPlayer() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleToggle = () => {
    if (!isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <button
        onClick={handleToggle}
        style={{
          background: isPlaying ? "#f44336" : "#565EAA",
          color: "white",
          border: "none",
          borderRadius: "30px",
          padding: "16px 32px",
          fontSize: "1.3rem",
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: isPlaying ? "0 0 15px #f44336" : "0 0 15px #565EAA",
          transition: "all 0.3s ease",
          outline: "none",
        }}
      >
        {isPlaying ? "Pause? But why would you... 🤔" : "Click to Play the Hackathon Hype Song! ��"}
      </button>
      <audio
        ref={audioRef}
        src="/My Song.mp3"
        loop
        style={{ display: "none" }}
      />
    </div>
  );
}

export default HypeSongPlayer; 