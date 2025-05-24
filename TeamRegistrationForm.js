import React, { useState } from "react";

/**
 * TeamRegistrationForm
 * This component lets a user register a team for the hackathon.
 */
function TeamRegistrationForm() {
  // State for the team name and category
  const [teamName, setTeamName] = useState("");
  const [teamCategory, setTeamCategory] = useState("");

  // State for team members (at least 2 to start)
  const [members, setMembers] = useState([
    { email: "", location: "" },
    { email: "", location: "" },
  ]);

  // State for "open to more members" toggle
  const [openToMore, setOpenToMore] = useState(false);

  return (
    <form>
      <h2>Register Your Team</h2>
      {/* Team Name */}
      <label>
        Team Name:
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          required
        />
      </label>
      <br />

      {/* Team Category */}
      <label>
        Team Category:
        <select
          value={teamCategory}
          onChange={(e) => setTeamCategory(e.target.value)}
          required
        >
          <option value="">Select a category</option>
          <option value="Beginner">Beginner</option>
          <option value="Advanced">Advanced</option>
          {/* Add more categories as needed */}
        </select>
      </label>
      <br />

      {/* Team Members */}
      <h3>Team Members</h3>
      {members.map((member, idx) => (
        <div key={idx} style={{ marginBottom: "10px" }}>
          <label>
            Email:
            <input
              type="email"
              value={member.email}
              onChange={(e) => {
                const newMembers = [...members];
                newMembers[idx].email = e.target.value;
                setMembers(newMembers);
              }}
              required
            />
          </label>
          <label>
            Attending Location:
            <select
              value={member.location}
              onChange={(e) => {
                const newMembers = [...members];
                newMembers[idx].location = e.target.value;
                setMembers(newMembers);
              }}
              required
            >
              <option value="">Select location</option>
              <option value="Onsite">Onsite</option>
              <option value="Remote">Remote</option>
            </select>
          </label>
          {/* Remove member button (if more than 2 members) */}
          {members.length > 2 && (
            <button
              type="button"
              onClick={() => {
                setMembers(members.filter((_, i) => i !== idx));
              }}
            >
              Remove
            </button>
          )}
        </div>
      ))}

      {/* Add Member Button (up to 5 members) */}
      {members.length < 5 && (
        <button
          type="button"
          onClick={() =>
            setMembers([...members, { email: "", location: "" }])
          }
        >
          + Add Member
        </button>
      )}
      <br />

      {/* Open to more members toggle */}
      <label>
        Open to more members?
        <input
          type="checkbox"
          checked={openToMore}
          onChange={() => setOpenToMore(!openToMore)}
        />
      </label>
      <br />

      {/* Submit Button */}
      <button type="submit">Submit</button>
    </form>
  );
}

export default TeamRegistrationForm; 