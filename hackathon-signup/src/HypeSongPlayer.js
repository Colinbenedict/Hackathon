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
    <div style={{ textAlign: "center", margin: "20px 0" }}>
      <button
        onClick={handleToggle}
        style={{
          background: isPlaying ? "#ff9800" : "#2196f3",
          color: "white",
          border: "none",
          borderRadius: "30px",
          padding: "16px 32px",
          fontSize: "1.3rem",
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: isPlaying ? "0 0 10px #ff9800" : "0 0 10px #2196f3",
          transition: "all 0.2s"
        }}
      >
        {isPlaying ? "Pause Hackathon Hype Jam" : "Play Hackathon Hype Jam"}
      </button>
      <audio
        ref={audioRef}
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        loop
        style={{ display: "none" }}
      />
    </div>
  );
}

export default HypeSongPlayer; 