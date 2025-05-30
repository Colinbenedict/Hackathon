import React, { useState, useEffect } from "react";
import * as XLSX from 'xlsx';
import Confetti from 'react-confetti';
import { useNavigate } from "react-router-dom";

/**
 * TeamRegistrationForm
 * This component lets a user register a team or as a solo participant for the hackathon.
 */
const HACKATHONS = [
  { key: 'data_digital', label: 'Data and Digital' },
  { key: 'spend_management', label: 'Spend Management' },
  { key: 'corporate_services', label: 'Corporate Services' },
];

function TeamRegistrationForm() {
  // --- ALL HOOKS MUST BE AT THE TOP ---
  // Tab state: 'team' or 'solo' or 'edit' or 'admin'
  const [tab, setTab] = useState("team");
  const [teamName, setTeamName] = useState("");
  const [teamCategory, setTeamCategory] = useState("");
  const [members, setMembers] = useState([
    { email: "" },
    { email: "" },
  ]);
  const [openToMore, setOpenToMore] = useState(false);
  const [soloEmail, setSoloEmail] = useState("");
  const [soloProficiency, setSoloProficiency] = useState(3); // Default to middle for 1-5
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editFound, setEditFound] = useState(false);
  const [editType, setEditType] = useState(""); // 'team' or 'solo'
  const [editId, setEditId] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [editError, setEditError] = useState("");
  const [adminRegs, setAdminRegs] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminSelectedEditCode, setAdminSelectedEditCode] = useState("");
  const [adminTableFilter, setAdminTableFilter] = useState("team");
  const [adminFilters, setAdminFilters] = useState({
    team_name: '',
    team_category: '',
    member_email: '',
    open_to_more: '',
    solo_email: '',
    solo_proficiency: '',
    edit_code: '',
  });
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('vizient-dark-mode') === 'true';
  });
  const [adminDeleteMessage, setAdminDeleteMessage] = useState("");
  const [editDeleteMessage, setEditDeleteMessage] = useState("");
  const [adminAuthenticated, setAdminAuthenticated] = useState(() => localStorage.getItem('vizient-admin-auth') === 'true');
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [signUpCode, setSignUpCode] = useState("");
  const [hackathonDates, setHackathonDates] = useState({});
  const [now, setNow] = useState(Date.now());
  const [adminDateInput, setAdminDateInput] = useState("");
  const [adminDateMessage, setAdminDateMessage] = useState("");
  const [adminRegOpen, setAdminRegOpen] = useState(true);
  const [adminRegStatusLoading, setAdminRegStatusLoading] = useState(false);
  const [adminRegStatusMessage, setAdminRegStatusMessage] = useState("");
  const [regStatus, setRegStatus] = useState({});
  const [regClosedMsg, setRegClosedMsg] = useState("");
  const [showHomeAdminLogin, setShowHomeAdminLogin] = useState(false);
  const [adminQuestions, setAdminQuestions] = useState([]);
  const [adminQuestionsLoading, setAdminQuestionsLoading] = useState(false);
  const [adminQuestionsError, setAdminQuestionsError] = useState("");
  const [adminQuestionsSaveMsg, setAdminQuestionsSaveMsg] = useState("");
  const [customQuestions, setCustomQuestions] = useState([]);
  const [teamCustomAnswers, setTeamCustomAnswers] = useState({}); // { [questionId]: answer }
  const [teamMemberCustomAnswers, setTeamMemberCustomAnswers] = useState([]); // [{ [questionId]: answer }]
  const [soloCustomAnswers, setSoloCustomAnswers] = useState({}); // { [questionId]: answer }
  const [newOptionInputs, setNewOptionInputs] = useState({}); // { [questionIdx]: string }
  const [lastCompletedTab, setLastCompletedTab] = useState(null);
  const [participantTeams, setParticipantTeams] = useState([]);
  const navigate = useNavigate();

  // --- Metrics for Admin Dashboard ---
  const totalTeams = adminRegs.filter(r => r.reg_type === "team").length;
  const totalSolo = adminRegs.filter(r => r.reg_type === "solo").length;
  const totalParticipants =
    adminRegs.reduce((sum, r) =>
      r.reg_type === "team"
        ? sum + (r.members ? JSON.parse(r.members).length : 0)
        : sum + 1,
      0
    );
  const unassignedIndividuals = totalSolo;

  // --- ALL useEffect HOOKS ---
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('vizient-dark-mode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (tab !== 'admin') {
      setAdminPasswordInput("");
      setAdminPasswordError("");
    }
  }, [tab]);

  useEffect(() => {
    setSignUpCode("");
    setShowConfetti(false);
  }, [selectedHackathon, tab]);

  useEffect(() => {
    if (!selectedHackathon) {
      fetch(`${process.env.REACT_APP_API_URL}/api/hackathon-dates`)
        .then(res => res.json())
        .then(data => setHackathonDates(data));
    }
  }, [selectedHackathon]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log('now', now);
  }, [now]);

  useEffect(() => {
    if (tab === "admin" && selectedHackathon) {
      fetch(`${process.env.REACT_APP_API_URL}/api/hackathon-dates`)
        .then(res => res.json())
        .then(data => {
          const iso = data[selectedHackathon.key];
          if (iso) {
            const dt = new Date(iso);
            const local = dt.toISOString().slice(0, 16);
            setAdminDateInput(local);
          } else {
            setAdminDateInput("");
          }
        });
    }
  }, [tab, selectedHackathon]);

  useEffect(() => {
    if (tab === "admin" && selectedHackathon) {
      setAdminRegStatusLoading(true);
      fetch(`${process.env.REACT_APP_API_URL}/api/registration-status`)
        .then(res => res.json())
        .then(data => {
          setAdminRegOpen(data[selectedHackathon.key] !== false);
          setAdminRegStatusLoading(false);
        })
        .catch(() => setAdminRegStatusLoading(false));
    }
  }, [tab, selectedHackathon]);

  useEffect(() => {
    if (!selectedHackathon) {
      fetch(`${process.env.REACT_APP_API_URL}/api/registration-status`)
        .then(res => res.json())
        .then(data => setRegStatus(data));
    }
  }, [selectedHackathon]);

  useEffect(() => {
    if (tab === "admin" && selectedHackathon) {
      setAdminQuestionsLoading(true);
      fetch(`${process.env.REACT_APP_API_URL}/api/hackathon-questions?hackathon=${selectedHackathon.key}`)
        .then(res => res.json())
        .then(data => {
          setAdminQuestions(data.questions || []);
          setAdminQuestionsLoading(false);
        })
        .catch(() => {
          setAdminQuestionsError("Failed to load questions.");
          setAdminQuestionsLoading(false);
        });
    }
  }, [tab, selectedHackathon]);

  useEffect(() => {
    if (selectedHackathon) {
      fetch(`${process.env.REACT_APP_API_URL}/api/hackathon-questions?hackathon=${selectedHackathon.key}`)
        .then(res => res.json())
        .then(data => setCustomQuestions(data.questions || []));
    } else {
      setCustomQuestions([]);
    }
  }, [selectedHackathon]);

  useEffect(() => {
    setTeamCustomAnswers({});
    setTeamMemberCustomAnswers(members.map(() => ({ })));
    setSoloCustomAnswers({});
  }, [selectedHackathon, tab]);

  useEffect(() => {
    setTeamMemberCustomAnswers(prev => {
      const arr = [...prev];
      while (arr.length < members.length) arr.push({});
      while (arr.length > members.length) arr.pop();
      return arr;
    });
  }, [members]);

  useEffect(() => {
    if (tab === "admin" && selectedHackathon) {
      setAdminLoading(true);
      setAdminError("");
      fetch(`${process.env.REACT_APP_API_URL}/api/registrations?hackathon=${selectedHackathon.key}`)
        .then(res => res.json())
        .then(data => {
          setAdminRegs(data.registrations || []);
          setAdminLoading(false);
        })
        .catch(() => {
          setAdminError("Failed to load registrations.");
          setAdminLoading(false);
        });
    }
  }, [tab, selectedHackathon]);

  useEffect(() => {
    if ((lastCompletedTab === 'team' && tab !== 'team') || (lastCompletedTab === 'solo' && tab !== 'solo')) {
      if (lastCompletedTab === 'team') {
        setTeamName("");
        setTeamCategory("");
        setMembers([
          { email: "" },
          { email: "" },
        ]);
        setOpenToMore(false);
        setTeamCustomAnswers({});
        setTeamMemberCustomAnswers([]);
        setMessage("");
        setError("");
        setSignUpCode("");
        setShowConfetti(false);
      } else if (lastCompletedTab === 'solo') {
        setSoloEmail("");
        setSoloProficiency(3);
        setSoloCustomAnswers({});
        setMessage("");
        setError("");
        setSignUpCode("");
        setShowConfetti(false);
      }
      setLastCompletedTab(null);
    }
  }, [tab, lastCompletedTab]);

  useEffect(() => {
    if (tab === "dashboard" && selectedHackathon) {
      fetch(`${process.env.REACT_APP_API_URL}/api/registrations?hackathon=${selectedHackathon.key}`)
        .then(res => res.json())
        .then(data => {
          setParticipantTeams((data.registrations || []).filter(r => r.reg_type === "team"));
        });
    }
  }, [tab, selectedHackathon]);

  // Helper to add a new option to a dropdown question
  function addDropdownOption(idx) {
    setAdminQuestions(qs => {
      const copy = [...qs];
      const val = (newOptionInputs[idx] || '').trim();
      if (val && (!copy[idx].options || !copy[idx].options.includes(val))) {
        copy[idx].options = [...(copy[idx].options || []), val];
      }
      return copy;
    });
    setNewOptionInputs(inputs => ({ ...inputs, [idx]: '' }));
  }

  // Helper to remove an option from a dropdown question
  function removeDropdownOption(idx, opt) {
    setAdminQuestions(qs => {
      const copy = [...qs];
      copy[idx].options = (copy[idx].options || []).filter(o => o !== opt);
      return copy;
    });
  }

  // Helper to get unique values for dropdown filters
  const getUniqueValues = (arr, key, isTeamMembers) => {
    if (isTeamMembers) {
      // For team member fields (email/location)
      return Array.from(new Set(
        arr.filter(r => r.reg_type === 'team' && r.members)
          .flatMap(r => JSON.parse(r.members).map(m => m[key] || ''))
      )).filter(Boolean);
    } else {
      return Array.from(new Set(arr.map(r => r[key] || ''))).filter(Boolean);
    }
  };

  // Filtered registrations for table (with search)
  const filteredAdminRegs = adminRegs.filter(reg => {
    if (adminTableFilter === 'team') {
      if (adminFilters.team_name && !(reg.team_name || '').toLowerCase().includes(adminFilters.team_name.toLowerCase())) return false;
      if (adminFilters.team_category && reg.team_category !== adminFilters.team_category) return false;
      if (adminFilters.member_email && !(reg.members ? JSON.parse(reg.members).some(m => (m.email || '').toLowerCase().includes(adminFilters.member_email.toLowerCase())) : false)) return false;
      if (adminFilters.open_to_more && String(reg.open_to_more ? 'yes' : 'no') !== adminFilters.open_to_more) return false;
      if (adminFilters.edit_code && !(reg.edit_code || '').toLowerCase().includes(adminFilters.edit_code.toLowerCase())) return false;
    } else if (adminTableFilter === 'solo') {
      if (adminFilters.solo_email && !(reg.solo_email || '').toLowerCase().includes(adminFilters.solo_email.toLowerCase())) return false;
      if (adminFilters.solo_proficiency && String(reg.solo_proficiency) !== String(adminFilters.solo_proficiency)) return false;
      if (adminFilters.edit_code && !(reg.edit_code || '').toLowerCase().includes(adminFilters.edit_code.toLowerCase())) return false;
    }
    return reg.reg_type === adminTableFilter;
  });

  // Helper for proficiency label
  const getProficiencyLabel = (value) => {
    if (value <= 2) return "Beginner";
    if (value === 3) return "Intermediate";
    return "Expert";
  };

  // 1. Add a helper to check for duplicate emails before submit
  async function checkDuplicateEmails(emails, editCode = null) {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/check-emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails, edit_code: editCode }),
      });
      const data = await response.json();
      return data.duplicates || [];
    } catch (err) {
      return [{ error: 'Network error. Could not check for duplicate emails.' }];
    }
  }

  // 2. In handleTeamSubmit, check for duplicates before submitting
  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    // Gather all member emails
    const memberEmails = members.map(m => m.email).filter(Boolean);
    const duplicates = await checkDuplicateEmails(memberEmails);
    if (duplicates.length > 0) {
      const msg = duplicates.map(d =>
        d.type === 'team'
          ? `${d.email} is already assigned to team ${d.team_name}.`
          : `${d.email} is already signed up as a solo participant.`
      ).join(' ');
      setError(msg);
      setSubmitting(false);
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reg_type: "team",
          team_name: teamName,
          team_category: teamCategory,
          members,
          open_to_more: openToMore,
          hackathon: selectedHackathon.key,
          team_custom_answers: teamCustomAnswers,
          team_member_custom_answers: teamMemberCustomAnswers,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Team registration successful!");
        setSignUpCode(data.edit_code || "");
        setShowConfetti(true);
        navigate('/success', { state: { signUpCode: data.edit_code } });
        setLastCompletedTab('team');
        // Reset form fields
        setTeamName("");
        setTeamCategory("");
        setMembers([
          { email: "" },
          { email: "" },
        ]);
        setOpenToMore(false);
        setTeamCustomAnswers({});
        setTeamMemberCustomAnswers([]);
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  // 3. In handleSoloSubmit, check for duplicates before submitting
  const handleSoloSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    const soloEmails = [soloEmail].filter(Boolean);
    const duplicates = await checkDuplicateEmails(soloEmails);
    if (duplicates.length > 0) {
      const msg = duplicates.map(d =>
        d.type === 'team'
          ? `${d.email} is already assigned to team ${d.team_name}.`
          : `${d.email} is already signed up as a solo participant.`
      ).join(' ');
      setError(msg);
      setSubmitting(false);
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reg_type: "solo",
          solo_email: soloEmail,
          solo_proficiency: soloProficiency,
          hackathon: selectedHackathon.key,
          solo_custom_answers: soloCustomAnswers,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Solo registration successful!");
        setSignUpCode(data.edit_code || "");
        setShowConfetti(true);
        navigate('/success', { state: { signUpCode: data.edit_code } });
        setLastCompletedTab('solo');
        // Reset solo form fields
        setSoloEmail("");
        setSoloProficiency(3);
        setSoloCustomAnswers({});
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  // Fetch registration by edit code
  const handleEditCodeSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditFound(false);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/register/${editCode}`);
      const data = await response.json();
      if (response.ok && data.registration) {
        if (data.registration.hackathon !== selectedHackathon.key) {
          setError("This code does not match the selected hackathon.");
          setEditLoading(false);
          return;
        }
        setEditFound(true);
        setEditType(data.registration.reg_type);
        setEditId(data.registration.id);
        if (data.registration.reg_type === "team") {
          setTeamName(data.registration.team_name || "");
          setTeamCategory(data.registration.team_category || "");
          setMembers(data.registration.members ? JSON.parse(data.registration.members).map(m => ({ email: m.email })) : [
            { email: "" },
            { email: "" },
          ]);
          setOpenToMore(data.registration.open_to_more || false);
          // Ensure custom answers are loaded for team
          setTeamCustomAnswers(data.registration.team_custom_answers ? (typeof data.registration.team_custom_answers === 'string' ? JSON.parse(data.registration.team_custom_answers) : data.registration.team_custom_answers) : {});
          setTeamMemberCustomAnswers(data.registration.team_member_custom_answers ? (typeof data.registration.team_member_custom_answers === 'string' ? JSON.parse(data.registration.team_member_custom_answers) : data.registration.team_member_custom_answers) : []);
        } else if (data.registration.reg_type === "solo") {
          setSoloEmail(data.registration.solo_email || "");
          setSoloProficiency(data.registration.solo_proficiency || 3);
          // Ensure custom answers are loaded for solo
          setSoloCustomAnswers(data.registration.solo_custom_answers ? (typeof data.registration.solo_custom_answers === 'string' ? JSON.parse(data.registration.solo_custom_answers) : data.registration.solo_custom_answers) : {});
        }
      } else {
        setError(data.error || "No registration found for that code.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
    setEditLoading(false);
  };

  // 4. In handleEditTeamEdit, check for duplicates (excluding current registration)
  const handleEditTeamEdit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    setEditMessage("");
    setEditError("");
    const memberEmails = members.map(m => m.email).filter(Boolean);
    const duplicates = await checkDuplicateEmails(memberEmails, editCode);
    if (duplicates.length > 0) {
      const msg = duplicates.map(d =>
        d.type === 'team'
          ? `${d.email} is already assigned to team ${d.team_name}.`
          : `${d.email} is already signed up as a solo participant.`
      ).join(' ');
      setEditError(msg);
      setEditSubmitting(false);
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/register/${editCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_name: teamName,
          team_category: teamCategory,
          members,
          open_to_more: openToMore,
          hackathon: selectedHackathon.key,
          team_custom_answers: teamCustomAnswers,
          team_member_custom_answers: teamMemberCustomAnswers,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setEditMessage("Team registration updated!");
        // Reset edit state and form fields after a short delay
        setTimeout(() => {
          setEditCode("");
          setEditFound(false);
          setEditType("");
          setEditId(null);
          setTeamName("");
          setTeamCategory("");
          setMembers([
            { email: "" },
            { email: "" },
          ]);
          setOpenToMore(false);
          setTab("team");
          setEditMessage("");
        }, 1500);
      } else {
        setEditError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setEditError("Network error. Please try again.");
    }
    setEditSubmitting(false);
  };

  // 5. In handleEditSoloEdit, check for duplicates (excluding current registration)
  const handleEditSoloEdit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    setEditMessage("");
    setEditError("");
    const soloEmails = [soloEmail].filter(Boolean);
    const duplicates = await checkDuplicateEmails(soloEmails, editCode);
    if (duplicates.length > 0) {
      const msg = duplicates.map(d =>
        d.type === 'team'
          ? `${d.email} is already assigned to team ${d.team_name}.`
          : `${d.email} is already signed up as a solo participant.`
      ).join(' ');
      setEditError(msg);
      setEditSubmitting(false);
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/register/${editCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solo_email: soloEmail,
          solo_proficiency: soloProficiency,
          hackathon: selectedHackathon.key,
          solo_custom_answers: soloCustomAnswers,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setEditMessage("Solo registration updated!");
        // Reset edit state and form fields after a short delay
        setTimeout(() => {
          setEditCode("");
          setEditFound(false);
          setEditType("");
          setEditId(null);
          setSoloEmail("");
          setSoloProficiency(3);
          setTab("team");
          setEditMessage("");
        }, 1500);
      } else {
        setEditError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setEditError("Network error. Please try again.");
    }
    setEditSubmitting(false);
  };

  // Handle admin dropdown selection
  const handleAdminSelect = (e) => {
    const code = e.target.value;
    if (code) {
      setEditCode(code);
      setTab("edit");
    }
    setAdminSelectedEditCode(code);
  };

  // Handler for filter input changes
  const handleAdminFilterChange = (field, value) => {
    setAdminFilters(prev => ({ ...prev, [field]: value }));
  };

  // Export to Excel handler
  const handleExportToExcel = () => {
    // Get custom questions for teams and solo
    const teamSpecificQuestions = customQuestions.filter(q => q.section === 'team');
    const teamMemberSpecificQuestions = customQuestions.filter(q => q.section === 'team_member');
    const soloSpecificQuestions = customQuestions.filter(q => q.section === 'solo');

    // --- Sheet 1: Team Custom Answers ---
    const teamCustomHeaders = [
      'Edit Code',
      'Team Name',
      'Team Category', // Added for context
      'Open to More Members', // Added for context
      ...teamSpecificQuestions.map(q => q.label),
    ];
    const teamCustomRows = adminRegs
      .filter(r => r.reg_type === 'team')
      .map(reg => {
        let customAnswers = {};
        try {
          customAnswers = typeof reg.team_custom_answers === 'string' ? JSON.parse(reg.team_custom_answers) : (reg.team_custom_answers || {});
        } catch { customAnswers = {}; }
        return [
          reg.edit_code || '',
          reg.team_name || '',
          reg.team_category || '',
          reg.open_to_more ? 'Yes' : 'No',
          ...teamSpecificQuestions.map(q => customAnswers[q.id] || ''),
        ];
      });

    // --- Sheet 2: Team Member Custom Answers ---
    const teamMemberCustomHeaders = [
      'Edit Code', // Team's edit code
      'Team Name',
      'Member Email',
      ...teamMemberSpecificQuestions.map(q => q.label),
    ];
    const teamMemberCustomRows = adminRegs
      .filter(r => r.reg_type === 'team')
      .flatMap(teamReg => {
        const members = teamReg.members ? JSON.parse(teamReg.members) : [];
        let memberAnswersArray = [];
        try {
          memberAnswersArray = typeof teamReg.team_member_custom_answers === 'string'
            ? JSON.parse(teamReg.team_member_custom_answers)
            : (teamReg.team_member_custom_answers || []);
        } catch { memberAnswersArray = []; }

        return members.map((member, idx) => {
          const memberCustomAns = memberAnswersArray[idx] || {};
          return [
            teamReg.edit_code || '',
            teamReg.team_name || '',
            member.email || '',
            ...teamMemberSpecificQuestions.map(q => memberCustomAns[q.id] || ''),
          ];
        });
      });

    // --- Sheet 3: Solo Custom Answers ---
    const soloCustomHeaders = [
      'Edit Code',
      'Solo Email',
      'Solo Proficiency', // Added for context
      ...soloSpecificQuestions.map(q => q.label),
    ];
    const soloCustomRows = adminRegs
      .filter(r => r.reg_type === 'solo')
      .map(reg => {
        let customAnswers = {};
        try {
          customAnswers = typeof reg.solo_custom_answers === 'string' ? JSON.parse(reg.solo_custom_answers) : (reg.solo_custom_answers || {});
        } catch { customAnswers = {}; }
        return [
          reg.edit_code || '',
          reg.solo_email || '',
          getProficiencyLabel(reg.solo_proficiency) + (reg.solo_proficiency ? ` (${reg.solo_proficiency})` : ''), // Display label and value
          ...soloSpecificQuestions.map(q => customAnswers[q.id] || ''),
        ];
      });

    // Create workbook and sheets
    const wb = XLSX.utils.book_new();

    const wsTeamCustom = XLSX.utils.aoa_to_sheet([teamCustomHeaders, ...teamCustomRows]);
    const wsTeamMemberCustom = XLSX.utils.aoa_to_sheet([teamMemberCustomHeaders, ...teamMemberCustomRows]);
    const wsSoloCustom = XLSX.utils.aoa_to_sheet([soloCustomHeaders, ...soloCustomRows]);

    // Helper to style header and set autofilter
    const styleSheet = (ws, headers, rows) => {
      const range = XLSX.utils.encode_range({
        s: { c: 0, r: 0 },
        e: { c: headers.length - 1, r: rows.length } // rows.length because data starts at row 1 (0-indexed)
      });
      ws['!autofilter'] = { ref: range };
      ws['!ref'] = range;
      headers.forEach((_, idx) => {
        const cell = XLSX.utils.encode_cell({ c: idx, r: 0 });
        if (ws[cell]) {
          ws[cell].s = {
            fill: { fgColor: { rgb: "565EAA" } },
            font: { color: { rgb: "FFFFFF" }, bold: true }
          };
        }
      });
    };

    styleSheet(wsTeamCustom, teamCustomHeaders, teamCustomRows);
    styleSheet(wsTeamMemberCustom, teamMemberCustomHeaders, teamMemberCustomRows);
    styleSheet(wsSoloCustom, soloCustomHeaders, soloCustomRows);

    XLSX.utils.book_append_sheet(wb, wsTeamCustom, 'Team Custom Answers');
    XLSX.utils.book_append_sheet(wb, wsTeamMemberCustom, 'Team Member Answers');
    XLSX.utils.book_append_sheet(wb, wsSoloCustom, 'Solo Custom Answers');

    // Download
    XLSX.writeFile(wb, 'hackathon_registrations_custom_answers.xlsx');
  };

  // Reset all state when changing hackathon
  const handleHackathonSelect = (hackathon) => {
    setSelectedHackathon(hackathon);
    setTab('team');
    setTeamName("");
    setTeamCategory("");
    setMembers([
      { email: "" },
      { email: "" },
    ]);
    setOpenToMore(false);
    setSoloEmail("");
    setSoloProficiency(3);
    setEditCode("");
    setEditFound(false);
    setEditType("");
    setEditId(null);
    setMessage("");
    setError("");
    setEditMessage("");
    setEditError("");
    setAdminSelectedEditCode("");
    setAdminTableFilter("team");
    setAdminFilters({
      team_name: '',
      team_category: '',
      member_email: '',
      open_to_more: '',
      solo_email: '',
      solo_proficiency: '',
      edit_code: '',
    });
  };

  // 2. Add a function to handle deletion
  const handleDeleteRegistration = async (editCode) => {
    if (!window.confirm("Are you sure you want to delete this registration? This cannot be undone.")) return;
    setAdminDeleteMessage("");
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/register/${editCode}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok) {
        setAdminDeleteMessage("Registration deleted successfully.");
        // Refresh registrations
        fetch(`${process.env.REACT_APP_API_URL}/api/registrations?hackathon=${selectedHackathon.key}`)
          .then(res => res.json())
          .then(data => setAdminRegs(data.registrations || []));
      } else {
        setAdminDeleteMessage(data.error || "Failed to delete registration.");
      }
    } catch (err) {
      setAdminDeleteMessage("Network error. Please try again.");
    }
  };

  // 2. Add a function to handle edit delete
  const handleEditDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this registration? This cannot be undone.")) return;
    setEditDeleteMessage("");
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/register/${editCode}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok) {
        setEditDeleteMessage("Registration deleted successfully.");
        // Reset edit state and form fields after a short delay
        setTimeout(() => {
          setEditCode("");
          setEditFound(false);
          setEditType("");
          setEditId(null);
          setTeamName("");
          setTeamCategory("");
          setMembers([
            { email: "" },
            { email: "" },
          ]);
          setOpenToMore(false);
          setSoloEmail("");
          setSoloProficiency(3);
          setTab("team");
          setEditMessage("");
          setEditError("");
          setEditDeleteMessage("");
        }, 1500);
      } else {
        setEditDeleteMessage(data.error || "Failed to delete registration.");
      }
    } catch (err) {
      setEditDeleteMessage("Network error. Please try again.");
    }
  };

  // 3. When Done is clicked, hide the success message and reset signUpCode
  const handleSignUpSuccessDone = () => {
    setSignUpCode("");
  };

  // 4. Helper to format countdown
  function getCountdown(targetIso) {
    if (!targetIso) return null;
    const target = new Date(targetIso);
    const diff = target - now;
    if (isNaN(target.getTime()) || diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    return `${days}d ${hours}h ${mins}m ${secs}s`;
  }

  // Helper to update a question
  function updateQuestion(idx, field, value) {
    setAdminQuestions(qs => {
      const copy = [...qs];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  }

  // Helper to update dropdown options
  function updateQuestionOptions(idx, optionsStr) {
    setAdminQuestions(qs => {
      const copy = [...qs];
      copy[idx] = { ...copy[idx], options: optionsStr.split(',').map(s => s.trim()).filter(Boolean) };
      return copy;
    });
  }

  // Helper to add a new question
  function addNewQuestion() {
    setAdminQuestions(qs => [
      ...qs,
      { id: `q${Date.now()}`, label: '', type: 'text', options: [], section: 'team' }
    ]);
  }

  // Helper to delete a question
  function deleteQuestion(idx) {
    setAdminQuestions(qs => qs.filter((_, i) => i !== idx));
  }

  // Save questions to backend
  async function saveQuestions() {
    setAdminQuestionsSaveMsg("");
    setAdminQuestionsError("");
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/hackathon-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hackathon_key: selectedHackathon.key, questions: adminQuestions }),
      });
      const data = await response.json();
      if (response.ok) {
        setAdminQuestionsSaveMsg("Questions saved!");
        setTimeout(() => setAdminQuestionsSaveMsg("") , 1500);
      } else {
        setAdminQuestionsError(data.error || "Failed to save questions.");
      }
    } catch (err) {
      setAdminQuestionsError("Network error. Please try again.");
    }
  }

  // Helper to render a custom question
  function renderCustomQuestion(q, value, onChange) {
    if (q.type === 'dropdown') {
      return (
        <label className="vizient-label" style={{ display: 'block', marginBottom: 10 }}>
          {q.label}
          <select
            className="vizient-select"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            required
          >
            <option value="">Select...</option>
            {(q.options || []).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </label>
      );
    }
    // Default to text
    return (
      <label className="vizient-label" style={{ display: 'block', marginBottom: 10 }}>
        {q.label}
        <input
          className="vizient-input"
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          required
        />
      </label>
    );
  }

  // If admin is authenticated from home, show hackathon picker for admin
  if (adminAuthenticated && showHomeAdminLogin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--bg)' }}>
        <button
          onClick={() => setDarkMode(dm => !dm)}
          style={{
            position: 'fixed',
            top: 18,
            right: 24,
            zIndex: 1000,
            background: 'none',
            border: 'none',
            fontSize: 28,
            cursor: 'pointer',
            color: darkMode ? '#FFD700' : '#565EAA',
            transition: 'color 0.2s',
          }}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? '🌙' : '☀️'}
        </button>
        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center', background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 4px 24px var(--card-shadow)', padding: '48px 32px 40px 32px' }}>
          <h1 className="vizient-heading" style={{ fontSize: 38, marginBottom: 8 }}>
            Admin: Select a Hackathon <span role="img" aria-label="rocket">🚀</span>
          </h1>
          <div style={{ fontSize: 20, color: '#565EAA', marginBottom: 32, fontWeight: 500 }}>
            Pick a hackathon to manage.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {HACKATHONS.map(h => (
              <button
                key={h.key}
                className="vizient-button"
                style={{
                  fontSize: 22,
                  padding: '28px 0',
                  fontWeight: 700,
                  borderRadius: 12,
                  background: '#565EAA',
                  color: '#fff',
                  boxShadow: '0 2px 8px #565EAA22',
                  transition: 'background 0.2s, transform 0.2s',
                  cursor: 'pointer',
                  opacity: 1,
                }}
                onClick={() => {
                  setSelectedHackathon(h);
                  setTab('admin');
                  setShowHomeAdminLogin(false);
                }}
              >
                {h.label}
              </button>
            ))}
          </div>
          <button
            className="vizient-button"
            style={{ marginTop: 32, background: '#888', color: '#fff', fontSize: 14 }}
            onClick={() => {
              setAdminAuthenticated(false);
              setShowHomeAdminLogin(false);
              localStorage.removeItem('vizient-admin-auth');
            }}
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // If admin login is requested, show login form
  if (showHomeAdminLogin && !adminAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--bg)' }}>
        <button
          onClick={() => setDarkMode(dm => !dm)}
          style={{
            position: 'fixed',
            top: 18,
            right: 24,
            zIndex: 1000,
            background: 'none',
            border: 'none',
            fontSize: 28,
            cursor: 'pointer',
            color: darkMode ? '#FFD700' : '#565EAA',
            transition: 'color 0.2s',
          }}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? '🌙' : '☀️'}
        </button>
        <div style={{ maxWidth: 400, margin: '48px auto', background: 'var(--card-bg)', borderRadius: 12, boxShadow: '0 2px 12px #565EAA22', padding: '32px 24px', textAlign: 'center' }}>
          <h2 className="vizient-heading" style={{ marginBottom: 18 }}>Admin Login</h2>
          <label className="vizient-label" style={{ fontWeight: 500, fontSize: 18 }}>
            Enter Admin Password:
            <input
              className="vizient-input"
              type="password"
              value={adminPasswordInput}
              onChange={e => setAdminPasswordInput(e.target.value)}
              style={{ marginTop: 12, fontSize: 18, width: '100%' }}
              autoFocus
            />
          </label>
          <button
            className="vizient-button"
            style={{ marginTop: 18, fontSize: 18, padding: '8px 32px' }}
            onClick={async () => {
              setAdminPasswordError(""); // Clear previous errors
              try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/login`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ password: adminPasswordInput }),
                });
                const data = await response.json();
                if (response.ok) {
                  setAdminAuthenticated(true);
                  localStorage.setItem('vizient-admin-auth', 'true');
                } else {
                  setAdminPasswordError(data.error || "Login failed. Please check password.");
                  setAdminAuthenticated(false);
                  localStorage.removeItem('vizient-admin-auth');
                }
              } catch (err) {
                setAdminPasswordError("Network error during login. Please try again.");
                setAdminAuthenticated(false);
                localStorage.removeItem('vizient-admin-auth');
              }
            }}
          >
            Login
          </button>
          {adminPasswordError && <div style={{ color: '#FF4E00', marginTop: 14 }}>{adminPasswordError}</div>}
          <button
            className="vizient-button"
            style={{ marginTop: 24, background: '#888', color: '#fff', fontSize: 14 }}
            onClick={() => setShowHomeAdminLogin(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // If no hackathon is selected, show the home page
  if (!selectedHackathon) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--bg)' }}>
        {/* Dark mode toggle button on Home page */}
        <button
          onClick={() => setDarkMode(dm => !dm)}
          style={{
            position: 'fixed',
            top: 18,
            right: 24,
            zIndex: 1000,
            background: 'none',
            border: 'none',
            fontSize: 28,
            cursor: 'pointer',
            color: darkMode ? '#FFD700' : '#565EAA',
            transition: 'color 0.2s',
          }}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? '🌙' : '☀️'}
        </button>
        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center', background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 4px 24px var(--card-shadow)', padding: '48px 32px 40px 32px' }}>
          <h1 className="vizient-heading" style={{ fontSize: 38, marginBottom: 8 }}>
            Welcome to the Vizient Hackathon Portal! <span role="img" aria-label="rocket">🚀</span>
          </h1>
          <div style={{ fontSize: 20, color: '#565EAA', marginBottom: 32, fontWeight: 500 }}>
            Pick your event below to start your journey.
          </div>
          {regClosedMsg && (
            <div style={{ color: '#FF4E00', fontWeight: 600, marginBottom: 18, fontSize: 18 }}>{regClosedMsg}</div>
          )}
          <h2 className="vizient-heading" style={{ fontSize: 28, marginBottom: 32 }}>Select a Hackathon</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {HACKATHONS.map(h => {
              const isClosed = regStatus[h.key] === false;
              return (
                <button
                  key={h.key}
                  className="vizient-button"
                  style={{
                    fontSize: 22,
                    padding: '28px 0',
                    fontWeight: 700,
                    borderRadius: 12,
                    background: isClosed ? '#bbb' : '#565EAA',
                    color: isClosed ? '#fff' : '#fff',
                    boxShadow: '0 2px 8px #565EAA22',
                    transition: 'background 0.2s, transform 0.2s',
                    cursor: isClosed ? 'not-allowed' : 'pointer',
                    opacity: isClosed ? 0.7 : 1,
                    pointerEvents: isClosed ? 'auto' : 'auto',
                  }}
                  onClick={() => {
                    if (isClosed) {
                      setRegClosedMsg("Registration closed");
                      setTimeout(() => setRegClosedMsg(""), 1500);
                    } else {
                      handleHackathonSelect(h);
                    }
                  }}
                  onMouseEnter={() => {
                    if (isClosed) setRegClosedMsg("Registration closed");
                  }}
                  onMouseLeave={() => {
                    if (isClosed) setRegClosedMsg("");
                  }}
                >
                  {h.label}
                </button>
              );
            })}
          </div>
          {/* Admin Login button on home page */}
          <button
            className="vizient-button"
            style={{ marginTop: 36, background: '#565EAA', color: '#fff', fontSize: 18, borderRadius: 8, padding: '12px 32px', fontWeight: 700 }}
            onClick={() => setShowHomeAdminLogin(true)}
          >
            Admin Login
          </button>
        </div>
      </div>
    );
  }

  // 6. After hackathon is selected, show the countdown for the selected hackathon at the top
  let selectedCountdown = null;
  if (selectedHackathon) {
    const iso = hackathonDates[selectedHackathon.key];
    selectedCountdown = (
      <div style={{ margin: '0 0 18px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 17, color: '#FF4E00', fontWeight: 700, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span role="img" aria-label="rocket">🚀</span> Hackathon Lift Off Countdown
        </span>
        {iso ? (
          <>
            <span style={{ fontSize: 21, color: '#565EAA', fontWeight: 700, letterSpacing: 1, marginTop: 2 }}>
              {getCountdown(iso) || 'Started!'}
            </span>
            <span style={{ fontSize: 15, color: '#565EAA', fontWeight: 500, marginTop: 2 }}>
              {selectedHackathon.label} ({new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })})
            </span>
          </>
        ) : (
          <span style={{ fontSize: 16, color: '#888', fontWeight: 500, marginTop: 2 }}>
            No start date set for this hackathon.
          </span>
        )}
      </div>
    );
  }

  // Add debug log before rendering the form
  console.log("customQuestions", customQuestions);

  return (
    <div className="vizient-form">
      {/* Dark mode toggle button */}
      <button
        onClick={() => setDarkMode(dm => !dm)}
        style={{
          position: 'fixed',
          top: 18,
          right: 24,
          zIndex: 1000,
          background: 'none',
          border: 'none',
          fontSize: 28,
          cursor: 'pointer',
          color: darkMode ? '#FFD700' : '#565EAA',
          transition: 'color 0.2s',
        }}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? '🌙' : '☀️'}
      </button>
      {/* Hackathon header and change button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
        <h1 className="vizient-heading" style={{ marginBottom: 0, fontSize: 28 }}>
          {selectedHackathon.label} Hackathon
        </h1>
        <button className="vizient-button" style={{ fontSize: 14, padding: '6px 16px' }} onClick={() => setSelectedHackathon(null)}>
          Change Hackathon
        </button>
      </div>
      {/* Show countdown for selected hackathon */}
      {selectedCountdown}
      {/* Tabs */}
      <div className="vizient-tabs">
        <button
          className={`vizient-tab${tab === "team" ? " vizient-tab-active" : ""}`}
          type="button"
          onClick={() => setTab("team")}
        >
          Register Team
        </button>
        <button
          className={`vizient-tab${tab === "solo" ? " vizient-tab-active" : ""}`}
          type="button"
          onClick={() => setTab("solo")}
        >
          Register Solo
        </button>
        <button
          className={`vizient-tab${tab === "edit" ? " vizient-tab-active" : ""}`}
          type="button"
          onClick={() => setTab("edit")}
        >
          Edit Registration
        </button>
        {adminAuthenticated && (
          <button
            className={`vizient-tab${tab === "admin" ? " vizient-tab-active" : ""}`}
            type="button"
            onClick={() => setTab("admin")}
          >
            Admin Dashboard
          </button>
        )}
        <button
          className={`vizient-tab${tab === "dashboard" ? " vizient-tab-active" : ""}`}
          type="button"
          onClick={() => setTab("dashboard")}
        >
          Participant Dashboard
        </button>
      </div>

      {/* Success/Error Message */}
      {message && <div style={{ color: "#93C840", marginBottom: 12 }}>{message}</div>}
      {error && <div style={{ color: "#FF4E00", marginBottom: 12 }}>{error}</div>}

      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={250} recycle={false} />}
      {signUpCode && (
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
          <div style={{
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
            onClick={handleSignUpSuccessDone}
          >
            Done
          </button>
        </div>
      )}

      {/* Team Registration Form */}
      {tab === "team" && (
        <form onSubmit={handleTeamSubmit}>
          <h2 className="vizient-heading">Register Your Team</h2>
          {/* Team Name */}
          <label className="vizient-label">
            Team Name:
            <input
              className="vizient-input"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
            />
          </label>
          <br />
          {/* Team Category */}
          <label className="vizient-label">
            Team Category:
            <select
              className="vizient-select"
              value={teamCategory}
              onChange={(e) => setTeamCategory(e.target.value)}
              required
            >
              <option value="">Select a category</option>
              <option value="Ideation & Strategy">Ideation & Strategy</option>
              <option value="Creation & Development">Creation & Development</option>
              <option value="Insights & Optimization">Insights & Optimization</option>
            </select>
          </label>
          <br />
          {/* Team-level custom questions */}
          {customQuestions.filter(q => q.section === 'team').map(q =>
            <div key={q.id}>
              {renderCustomQuestion(
                q,
                teamCustomAnswers[q.id],
                val => setTeamCustomAnswers(a => ({ ...a, [q.id]: val }))
              )}
            </div>
          )}
          {/* Team Members */}
          <h3 className="vizient-subhead">Team Members</h3>
          {members.map((member, idx) => (
            <div key={idx} className="vizient-member-row" style={{ marginBottom: "10px" }}>
              <label className="vizient-label">
                Email:
                <input
                  className="vizient-input"
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
              {/* Team member-level custom questions */}
              {customQuestions.filter(q => q.section === 'team_member').map(q =>
                <div key={q.id}>
                  {renderCustomQuestion(
                    q,
                    teamMemberCustomAnswers[idx]?.[q.id],
                    val => setTeamMemberCustomAnswers(ansArr => {
                      const arr = [...ansArr];
                      arr[idx] = { ...arr[idx], [q.id]: val };
                      return arr;
                    })
                  )}
                </div>
              )}
              {/* Remove member button (if more than 2 members) */}
              {members.length > 2 && (
                <button
                  className="vizient-button vizient-remove-btn"
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
              className="vizient-button vizient-add-btn"
              type="button"
              onClick={() =>
                setMembers([...members, { email: "" }])
              }
            >
              + Add Member
            </button>
          )}
          <br />
          {/* Only show this if there are fewer than 5 members */}
          {members.length < 5 && (
            <>
              <label className="vizient-label vizient-checkbox-label">
                Open to more members?
                <input
                  className="vizient-checkbox"
                  type="checkbox"
                  checked={openToMore}
                  onChange={e => setOpenToMore(e.target.checked)}
                />
              </label>
            </>
          )}
          {/* Submit Button */}
          <button className="vizient-button vizient-submit-btn" type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      )}

      {/* Solo Registration Form */}
      {tab === "solo" && (
        <form onSubmit={handleSoloSubmit}>
          <h2 className="vizient-heading">Register Solo</h2>
          {/* Default solo questions first */}
          <label className="vizient-label">
            Email:
            <input
              className="vizient-input"
              type="email"
              value={soloEmail}
              onChange={(e) => setSoloEmail(e.target.value)}
              required
            />
          </label>
          <br />
          <label className="vizient-label">
            How proficient are you with ChatGPT?
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <input
                type="range"
                min="1"
                max="5"
                value={soloProficiency}
                onChange={e => setSoloProficiency(Number(e.target.value))}
                className="vizient-slider"
                style={{ flex: 1 }}
              />
              <span style={{ minWidth: 60 }}>
                {soloProficiency} ({getProficiencyLabel(soloProficiency)})
              </span>
            </div>
          </label>
          <br />
          {/* Solo custom questions after default */}
          {customQuestions.filter(q => q.section === 'solo').map(q =>
            renderCustomQuestion(q, soloCustomAnswers[q.id], val => setSoloCustomAnswers(a => ({ ...a, [q.id]: val })))
          )}
          {/* ...rest of form... */}
          <button className="vizient-button vizient-submit-btn" type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      )}

      {/* Edit Registration Tab */}
      {tab === "edit" && (
        <div>
          <form onSubmit={handleEditCodeSubmit} style={{ marginBottom: 24 }}>
            <label className="vizient-label">
              Enter your edit code:
              <input
                className="vizient-input"
                type="text"
                value={editCode}
                onChange={e => setEditCode(e.target.value.toUpperCase())}
                required
                maxLength={12}
                style={{ width: 200 }}
              />
            </label>
            <button className="vizient-button vizient-submit-btn" type="submit" disabled={editLoading}>
              {editLoading ? "Loading..." : "Find Registration"}
            </button>
          </form>
          {editFound && (
            <>
              {editMessage && <div style={{ color: "#93C840", marginBottom: 12 }}>{editMessage}</div>}
              {editError && <div style={{ color: "#FF4E00", marginBottom: 12 }}>{editError}</div>}
            </>
          )}
          {editFound && editType === "team" && (
            <form onSubmit={handleEditTeamEdit}>
              <h2 className="vizient-heading">Edit Team Registration</h2>
              {/* Team form fields (same as register) */}
              <label className="vizient-label">
                Team Name:
                <input
                  className="vizient-input"
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                />
              </label>
              <br />
              <label className="vizient-label">
                Team Category:
                <select
                  className="vizient-select"
                  value={teamCategory}
                  onChange={(e) => setTeamCategory(e.target.value)}
                  required
                >
                  <option value="">Select a category</option>
                  <option value="Ideation & Strategy">Ideation & Strategy</option>
                  <option value="Creation & Development">Creation & Development</option>
                  <option value="Insights & Optimization">Insights & Optimization</option>
                </select>
              </label>
              <br />
              <h3 className="vizient-subhead">Team Members</h3>
              {members.map((member, idx) => (
                <div key={idx} className="vizient-member-row" style={{ marginBottom: "10px" }}>
                  <label className="vizient-label">
                    Email:
                    <input
                      className="vizient-input"
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
                  {members.length > 2 && (
                    <button
                      className="vizient-button vizient-remove-btn"
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
              {members.length < 5 && (
                <button
                  className="vizient-button vizient-add-btn"
                  type="button"
                  onClick={() =>
                    setMembers([...members, { email: "" }])
                  }
                >
                  + Add Member
                </button>
              )}
              <br />
              {members.length < 5 && (
                <>
                  <label className="vizient-label vizient-checkbox-label">
                    Open to more members?
                    <input
                      className="vizient-checkbox"
                      type="checkbox"
                      checked={openToMore}
                      onChange={() => setOpenToMore(!openToMore)}
                    />
                  </label>
                </>
              )}
              <button className="vizient-button vizient-submit-btn" type="submit" disabled={editSubmitting}>
                {editSubmitting ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="vizient-button vizient-remove-btn"
                style={{ background: '#FF4E00', color: '#fff', fontWeight: 700, marginLeft: 16, padding: '8px 18px', borderRadius: 6 }}
                onClick={handleEditDelete}
                disabled={editSubmitting}
              >
                Delete Registration
              </button>
            </form>
          )}
          {editFound && editType === "solo" && (
            <form onSubmit={handleEditSoloEdit}>
              <h2 className="vizient-heading">Edit Solo Registration</h2>
              {/* Default solo questions first */}
              <label className="vizient-label">
                Email:
                <input
                  className="vizient-input"
                  type="email"
                  value={soloEmail}
                  onChange={(e) => setSoloEmail(e.target.value)}
                  required
                />
              </label>
              <br />
              <label className="vizient-label">
                How proficient are you with ChatGPT?
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={soloProficiency}
                    onChange={e => setSoloProficiency(Number(e.target.value))}
                    className="vizient-slider"
                    style={{ flex: 1 }}
                  />
                  <span style={{ minWidth: 60 }}>
                    {soloProficiency} ({getProficiencyLabel(soloProficiency)})
                  </span>
                </div>
              </label>
              <br />
              {/* Solo custom questions after default */}
              {customQuestions.filter(q => q.section === 'solo').map(q =>
                renderCustomQuestion(q, soloCustomAnswers[q.id], val => setSoloCustomAnswers(a => ({ ...a, [q.id]: val })))
              )}
              {/* ...rest of form... */}
              <button className="vizient-button vizient-submit-btn" type="submit" disabled={editSubmitting}>
                {editSubmitting ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="vizient-button vizient-remove-btn"
                style={{ background: '#FF4E00', color: '#fff', fontWeight: 700, marginLeft: 16, padding: '8px 18px', borderRadius: 6 }}
                onClick={handleEditDelete}
                disabled={editSubmitting}
              >
                Delete Registration
              </button>
            </form>
          )}
          {editFound && editDeleteMessage && (
            <div style={{ color: editDeleteMessage.includes("success") ? "#93C840" : "#FF4E00", marginBottom: 12 }}>{editDeleteMessage}</div>
          )}
        </div>
      )}

      {/* Admin Dashboard Tab */}
      {tab === "admin" && !adminAuthenticated && (
        <div style={{ maxWidth: 400, margin: '48px auto', background: 'var(--card-bg)', borderRadius: 12, boxShadow: '0 2px 12px #565EAA22', padding: '32px 24px', textAlign: 'center' }}>
          <h2 className="vizient-heading" style={{ marginBottom: 18 }}>Admin Login</h2>
          <label className="vizient-label" style={{ fontWeight: 500, fontSize: 18 }}>
            Enter Admin Password:
            <input
              className="vizient-input"
              type="password"
              value={adminPasswordInput}
              onChange={e => setAdminPasswordInput(e.target.value)}
              style={{ marginTop: 12, fontSize: 18, width: '100%' }}
              autoFocus
            />
          </label>
          <button
            className="vizient-button"
            style={{ marginTop: 18, fontSize: 18, padding: '8px 32px' }}
            onClick={async () => {
              setAdminPasswordError(""); // Clear previous errors
              try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/login`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ password: adminPasswordInput }),
                });
                const data = await response.json();
                if (response.ok) {
                  setAdminAuthenticated(true);
                  localStorage.setItem('vizient-admin-auth', 'true');
                } else {
                  setAdminPasswordError(data.error || "Login failed. Please check password.");
                  setAdminAuthenticated(false);
                  localStorage.removeItem('vizient-admin-auth');
                }
              } catch (err) {
                setAdminPasswordError("Network error during login. Please try again.");
                setAdminAuthenticated(false);
                localStorage.removeItem('vizient-admin-auth');
              }
            }}
          >
            Login
          </button>
          {adminPasswordError && <div style={{ color: '#FF4E00', marginTop: 14 }}>{adminPasswordError}</div>}
        </div>
      )}
      {tab === "admin" && adminAuthenticated && (
        <div>
          <h2 className="vizient-heading">Admin Dashboard</h2>

          {/* Key Metrics */}
          {!adminLoading && !adminError && (
            <div style={{ display: 'flex', gap: 24, marginBottom: 24, background: 'var(--card-bg-alt)', padding: 16, borderRadius: 8, boxShadow: '0 1px 4px var(--card-shadow)' }}>
              <div><strong>Total Teams:</strong> {totalTeams}</div>
              <div><strong>Total Participants:</strong> {totalParticipants}</div>
              <div><strong>Unassigned Individuals:</strong> {unassignedIndividuals}</div>
            </div>
          )}

          {adminLoading && <div>Loading registrations...</div>}
          {adminError && <div style={{ color: "#FF4E00" }}>{adminError}</div>}
          {adminDeleteMessage && <div style={{ color: adminDeleteMessage.includes("success") ? "#93C840" : "#FF4E00", marginBottom: 12 }}>{adminDeleteMessage}</div>}

          {/* Registrations Table & Actions */}
          {!adminLoading && !adminError && (
            <div style={{ background: 'var(--card-bg)', padding: 24, borderRadius: 12, boxShadow: '0 2px 12px var(--card-shadow)', marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <h3 className="vizient-subhead" style={{margin: 0}}>Manage Registrations</h3>
                <button className="vizient-button" onClick={handleExportToExcel}>
                  Export to Excel
                </button>
              </div>

              <div style={{ marginBottom: 24, display: 'flex', gap: 24, alignItems: 'center', flexDirection: 'column', alignItems: 'flex-start' }}>
                <label className="vizient-label" htmlFor="admin-edit-select" style={{ marginBottom: 0 }}>
                  Quick Edit a registration:
                  <select
                    id="admin-edit-select"
                    className="vizient-select"
                    value={adminSelectedEditCode}
                    onChange={handleAdminSelect}
                    style={{ minWidth: 220, marginLeft: 12 }}
                  >
                    <option value="">Select a registration...</option>
                    {adminRegs.map((reg) => (
                      <option key={reg.id} value={reg.edit_code}>
                        {reg.reg_type === 'team'
                          ? `Team: ${reg.team_name || '(no name)'} (${reg.edit_code})`
                          : `Solo: ${reg.solo_email || '(no email)'} (${reg.edit_code})`}
                      </option>
                    ))}
                  </select>
                </label>
                
                <div style={{ display: 'flex', gap: 0, borderRadius: 4, overflow: 'hidden', border: '2px solid #565EAA' }}>
                  {['team', 'solo'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAdminTableFilter(type)}
                      style={{
                        background: adminTableFilter === type ? '#565EAA' : '#fff',
                        color: adminTableFilter === type ? '#fff' : '#565EAA',
                        border: 'none',
                        padding: '8px 24px',
                        fontWeight: 500,
                        fontFamily: 'Soleto, sans-serif',
                        fontSize: 16,
                        cursor: 'pointer',
                        transition: 'background 0.2s, color 0.2s',
                        outline: 'none',
                        borderRight: type !== 'solo' ? '1px solid #565EAA' : 'none',
                      }}
                    >
                      {type === 'team' ? 'Team Registrations' : 'Solo Registrations'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#565EAA', color: '#fff' }}>
                      <th style={{ padding: 8 }}>Type</th>
                      {adminTableFilter === 'team' && <th style={{ padding: 8 }}>Team Name</th>}
                      {adminTableFilter === 'team' && <th style={{ padding: 8 }}>Category</th>}
                      {adminTableFilter === 'team' && <th style={{ padding: 8 }}>Members</th>}
                      {adminTableFilter === 'team' && <th style={{ padding: 8 }}>Open to More</th>}
                      {adminTableFilter === 'team' && customQuestions.filter(q => q.section === 'team').map(q => (
                        <th key={q.id} style={{ padding: 8 }}>{q.label}</th>
                      ))}
                      {adminTableFilter === 'solo' && <th style={{ padding: 8 }}>Email</th>}
                      {adminTableFilter === 'solo' && <th style={{ padding: 8 }}>Proficiency</th>}
                      {adminTableFilter === 'solo' && customQuestions.filter(q => q.section === 'solo').map(q => (
                        <th key={q.id} style={{ padding: 8 }}>{q.label}</th>
                      ))}
                      <th style={{ padding: 8 }}>Edit Code</th>
                      <th style={{ padding: 8 }}>Delete</th>
                    </tr>
                    {/* Filter row */}
                    <tr>
                      <th></th> {/* Spacer for Type column */}
                      {adminTableFilter === 'team' && (
                        <>
                          <th><input className="vizient-input" style={{ width: '100%' }} placeholder="Search..." value={adminFilters.team_name} onChange={e => handleAdminFilterChange('team_name', e.target.value)} /></th>
                          <th>
                            <select className="vizient-select" style={{ width: '100%' }} value={adminFilters.team_category} onChange={e => handleAdminFilterChange('team_category', e.target.value)}>
                              <option value="">All</option>
                              {getUniqueValues(adminRegs, 'team_category').map(val => <option key={val} value={val}>{val}</option>)}
                            </select>
                          </th>
                          <th><input className="vizient-input" style={{ width: '100%' }} placeholder="Search..." value={adminFilters.member_email} onChange={e => handleAdminFilterChange('member_email', e.target.value)} /></th>
                          {/* Location filter was removed */}
                          {/* <th>
                            <select className="vizient-select" style={{ width: '100%' }} value={adminFilters.member_location} onChange={e => handleAdminFilterChange('member_location', e.target.value)}>
                              <option value="">All</option>
                              {getUniqueValues(adminRegs, 'location', true).map(val => <option key={val} value={val}>{val}</option>)}
                            </select>
                          </th> */}
                          <th>
                            <select className="vizient-select" style={{ width: '100%' }} value={adminFilters.open_to_more} onChange={e => handleAdminFilterChange('open_to_more', e.target.value)}>
                              <option value="">All</option>
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          </th>
                           {/* Spacers for custom team questions */}
                           {customQuestions.filter(q => q.section === 'team').map(q => (
                            <th key={`${q.id}-filter`}></th>
                          ))}
                        </>
                      )}
                      {adminTableFilter === 'solo' && (
                        <>
                          <th><input className="vizient-input" style={{ width: '100%' }} placeholder="Search..." value={adminFilters.solo_email} onChange={e => handleAdminFilterChange('solo_email', e.target.value)} /></th>
                          {/* Location filter was removed */}
                          {/* <th>
                            <select className="vizient-select" style={{ width: '100%' }} value={adminFilters.solo_location} onChange={e => handleAdminFilterChange('solo_location', e.target.value)}>
                              <option value="">All</option>
                              {getUniqueValues(adminRegs, 'solo_location').map(val => <option key={val} value={val}>{val}</option>)}
                            </select>
                          </th> */}
                          <th>
                            <select className="vizient-select" style={{ width: '100%' }} value={adminFilters.solo_proficiency} onChange={e => handleAdminFilterChange('solo_proficiency', e.target.value)}>
                              <option value="">All</option>
                              {getUniqueValues(adminRegs, 'solo_proficiency').map(val => <option key={val} value={val}>{getProficiencyLabel(val)} ({val})</option>)}
                            </select>
                          </th>
                          {/* Spacers for custom solo questions */}
                          {customQuestions.filter(q => q.section === 'solo').map(q => (
                            <th key={`${q.id}-filter`}></th>
                          ))}
                        </>
                      )}
                      <th><input className="vizient-input" style={{ width: '100%' }} placeholder="Search..." value={adminFilters.edit_code} onChange={e => handleAdminFilterChange('edit_code', e.target.value)} /></th>
                      <th></th> {/* Spacer for Delete column */}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdminRegs.map((reg) => {
                      // Parse custom answers (may be stringified JSON)
                      let teamCustom = {};
                      let soloCustom = {};
                      try {
                        teamCustom = typeof reg.team_custom_answers === 'string' ? JSON.parse(reg.team_custom_answers) : (reg.team_custom_answers || {});
                      } catch { teamCustom = {}; }
                      try {
                        soloCustom = typeof reg.solo_custom_answers === 'string' ? JSON.parse(reg.solo_custom_answers) : (reg.solo_custom_answers || {});
                      } catch { soloCustom = {}; }
                      return (
                        <tr key={reg.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: 8 }}>{reg.reg_type}</td>
                          {adminTableFilter === 'team' && <td style={{ padding: 8 }}>{reg.team_name || '-'}</td>}
                          {adminTableFilter === 'team' && <td style={{ padding: 8 }}>{reg.team_category || '-'}</td>}
                          {adminTableFilter === 'team' && (
                            <td style={{ padding: 8 }}>
                              {reg.members ? JSON.parse(reg.members).map((m, i) => (
                                <div key={i}>{m.email}</div>
                              )) : '-'}
                            </td>
                          )}
                          {/* Location data was removed */}
                          {/* {adminTableFilter === 'team' && (
                            <td style={{ padding: 8 }}>
                              {reg.members ? JSON.parse(reg.members).map((m, i) => m.location).join(', ') : '-'}
                            </td>
                          )} */}
                          {adminTableFilter === 'team' && (
                            <td style={{ padding: 8 }}>{reg.open_to_more ? 'Yes' : 'No'}</td>
                          )}
                          {adminTableFilter === 'team' && customQuestions.filter(q => q.section === 'team').map(q => (
                            <td key={q.id} style={{ padding: 8 }}>{teamCustom[q.id] || ''}</td>
                          ))}
                          {adminTableFilter === 'solo' && <td style={{ padding: 8 }}>{reg.solo_email}</td>}
                          {/* Location data was removed */}
                          {/* {adminTableFilter === 'solo' && <td style={{ padding: 8 }}>{reg.solo_location}</td>} */}
                          {adminTableFilter === 'solo' && <td style={{ padding: 8 }}>{getProficiencyLabel(reg.solo_proficiency)} ({reg.solo_proficiency})</td>}
                          {adminTableFilter === 'solo' && customQuestions.filter(q => q.section === 'solo').map(q => (
                            <td key={q.id} style={{ padding: 8 }}>{soloCustom[q.id] || ''}</td>
                          ))}
                          <td style={{ padding: 8 }}>{reg.edit_code}</td>
                          <td style={{ padding: 8 }}>
                            <button
                              className="vizient-button vizient-remove-btn"
                              style={{ background: '#FF4E00', color: '#fff', fontWeight: 700, padding: '4px 12px', borderRadius: 6 }}
                              onClick={() => handleDeleteRegistration(reg.edit_code)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Hackathon-Specific Settings */}
          {!adminLoading && !adminError && (
            <div style={{ background: 'var(--card-bg)', padding: 24, borderRadius: 12, boxShadow: '0 2px 12px var(--card-shadow)', marginBottom: 32 }}>
              <h3 className="vizient-subhead" style={{ marginTop:0, marginBottom: 24 }}>Hackathon Settings: {selectedHackathon.label}</h3>
              {/* Date/time picker for hackathon start */}
              <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <label className="vizient-label" style={{ marginBottom: 0, fontWeight: 600 }}>
                  Set Start Date/Time:
                  <input
                    type="datetime-local"
                    value={adminDateInput}
                    onChange={e => setAdminDateInput(e.target.value)}
                    style={{ marginLeft: 12, fontSize: 16, padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc' }}
                  />
                </label>
                <button
                  className="vizient-button"
                  style={{ fontSize: 15, padding: '6px 18px', borderRadius: 6 }}
                  onClick={async () => {
                    setAdminDateMessage("");
                    if (!adminDateInput) {
                      setAdminDateMessage("Please select a date and time.");
                      return;
                    }
                    // Convert local datetime to ISO string
                    const iso = new Date(adminDateInput).toISOString();
                    try {
                      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/hackathon-date`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ hackathon_key: selectedHackathon.key, start_datetime: iso }),
                      });
                      const data = await response.json();
                      if (response.ok) {
                        setAdminDateMessage("Start date/time saved!");
                        // Also update hackathonDates state for immediate countdown reflection
                        setHackathonDates(prev => ({...prev, [selectedHackathon.key]: iso}));
                        setTimeout(() => setAdminDateMessage(""), 1500);
                      } else {
                        setAdminDateMessage(data.error || "Failed to save date/time.");
                      }
                    } catch (err) {
                      setAdminDateMessage("Network error. Please try again.");
                    }
                  }}
                >
                  Save Date
                </button>
                {adminDateMessage && <span style={{ color: adminDateMessage.includes("saved") ? '#93C840' : '#FF4E00', fontWeight: 500 }}>{adminDateMessage}</span>}
              </div>

              {/* Registration open/close toggle for hackathon */}
              <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <label className="vizient-label" style={{ marginBottom: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                  Registration Status:
                  <input
                    type="checkbox"
                    checked={adminRegOpen}
                    disabled={adminRegStatusLoading}
                    onChange={e => setAdminRegOpen(e.target.checked)}
                    style={{ width: 22, height: 22, accentColor: adminRegOpen ? '#93C840' : '#FF4E00', marginLeft: 8 }}
                  />
                  <span style={{ color: adminRegOpen ? '#93C840' : '#FF4E00', fontWeight: 700, fontSize: 16 }}>
                    {adminRegOpen ? 'Open' : 'Closed'}
                  </span>
                </label>
                <button
                  className="vizient-button"
                  style={{ fontSize: 15, padding: '6px 18px', borderRadius: 6 }}
                  disabled={adminRegStatusLoading}
                  onClick={async () => {
                    setAdminRegStatusMessage("");
                    setAdminRegStatusLoading(true);
                    try {
                      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/registration-status`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ hackathon_key: selectedHackathon.key, registration_open: adminRegOpen }),
                      });
                      const data = await response.json();
                      if (response.ok) {
                        setAdminRegStatusMessage("Registration status updated!");
                        // Also update regStatus for immediate reflection on home page selector
                        setRegStatus(prev => ({...prev, [selectedHackathon.key]: adminRegOpen }));
                        setTimeout(() => setAdminRegStatusMessage(""), 1500);
                      } else {
                        setAdminRegStatusMessage(data.error || "Failed to update status.");
                      }
                    } catch (err) {
                      setAdminRegStatusMessage("Network error. Please try again.");
                    }
                    setAdminRegStatusLoading(false);
                  }}
                >
                  Save Status
                </button>
                {adminRegStatusMessage && <span style={{ color: adminRegStatusMessage.includes("updated") ? '#93C840' : '#FF4E00', fontWeight: 500 }}>{adminRegStatusMessage}</span>}
              </div>

              {/* --- Custom Questions Admin UI --- */}
              <div style={{ background: 'var(--card-bg-alt)', borderRadius: 10, boxShadow: '0 1px 4px var(--card-shadow)', padding: 24 }}>
                <h4 className="vizient-subhead" style={{ fontSize: 20, marginTop:0, marginBottom: 18 }}>Custom Registration Questions</h4>
                {adminQuestionsLoading && <div>Loading questions...</div>}
                {adminQuestionsError && <div style={{ color: '#FF4E00' }}>{adminQuestionsError}</div>}
                {adminQuestionsSaveMsg && <div style={{ color: '#93C840' }}>{adminQuestionsSaveMsg}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {adminQuestions.map((q, idx) => (
                    <div key={q.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, background: 'var(--bg)', borderRadius: 6, padding: 18, flexWrap: 'wrap' }}>
                      <input
                        className="vizient-input"
                        style={{ minWidth: 220, fontSize: 16, flex: '1 1 220px' }}
                        placeholder="Question label (e.g. T-shirt size)"
                        value={q.label}
                        onChange={e => updateQuestion(idx, 'label', e.target.value)}
                        required
                      />
                      <select
                        className="vizient-select"
                        value={q.type}
                        onChange={e => updateQuestion(idx, 'type', e.target.value)}
                        style={{ fontSize: 16, minWidth: 140, flex: '0 0 140px' }}
                      >
                        <option value="text">Text</option>
                        <option value="dropdown">Dropdown</option>
                      </select>
                      {q.type === 'dropdown' && (
                        <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 220px', minWidth: 220 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                              className="vizient-input"
                              style={{ minWidth: 120, fontSize: 16, flex: '1 1 120px' }}
                              placeholder="Add option"
                              value={newOptionInputs[idx] || ''}
                              onChange={e => setNewOptionInputs(inputs => ({ ...inputs, [idx]: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addDropdownOption(idx);
                                }
                              }}
                            />
                            <button
                              className="vizient-button"
                              style={{ padding: '6px 12px', fontSize: 15, borderRadius: 6, flexShrink: 0 }}
                              type="button"
                              onClick={() => addDropdownOption(idx)}
                            >
                              + Add
                            </button>
                          </div>
                          {(q.options && q.options.length > 0) && (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                              {(q.options || []).map(opt => (
                                <span key={opt} style={{ background: '#565EAA', color: '#fff', borderRadius: 12, padding: '4px 10px 4px 12px', display: 'flex', alignItems: 'center', fontSize: 14 }}>
                                  {opt}
                                  <button
                                    type="button"
                                    style={{ marginLeft: 6, background: 'none', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, padding: '0 2px' }}
                                    onClick={() => removeDropdownOption(idx, opt)}
                                    title="Remove option"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <select
                        className="vizient-select"
                        value={q.section || 'team'}
                        onChange={e => updateQuestion(idx, 'section', e.target.value)}
                        style={{ fontSize: 16, minWidth: 220, flex: '0 0 220px' }}
                      >
                        <option value="team">Team registration (whole team)</option>
                        <option value="team_member">Team registration (each member)</option>
                        <option value="solo">Solo registration</option>
                      </select>
                      <button
                        className="vizient-button vizient-remove-btn"
                        style={{ background: '#FF4E00', color: '#fff', fontWeight: 700, padding: '8px 16px', borderRadius: 6, minWidth: 80, alignSelf: 'center' }}
                        onClick={() => deleteQuestion(idx)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{marginTop: 18, display: 'flex', gap: 16}}>
                  <button
                    className="vizient-button"
                    style={{ fontSize: 16, padding: '8px 24px', borderRadius: 6 }}
                    onClick={addNewQuestion}
                    type="button"
                  >
                    + Add Question
                  </button>
                  <button
                    className="vizient-button"
                    style={{ fontSize: 16, padding: '8px 24px', borderRadius: 6, background: '#93C840', color: '#fff', fontWeight: 700 }}
                    onClick={saveQuestions}
                    type="button"
                  >
                    Save All Questions
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Log Out Button */}
          {!adminLoading && !adminError && (
            <button
              className="vizient-button"
              style={{ marginTop:0, background: '#888', color: '#fff', fontSize: 14 }}
              onClick={() => {
                setAdminAuthenticated(false);
                localStorage.removeItem('vizient-admin-auth');
              }}
            >
              Log Out
            </button>
          )}
        </div>
      )}
      {tab === "dashboard" && !selectedHackathon && (
        <div style={{ marginTop: 32 }}>
          <h2 className="vizient-heading">Participant Dashboard</h2>
          <div>Please select a hackathon to view the participant dashboard.</div>
        </div>
      )}
      {tab === "dashboard" && selectedHackathon && (
        <div style={{ marginTop: 32 }}>
          <h2 className="vizient-heading">Participant Dashboard</h2>
          {participantTeams.length === 0 ? (
            <div>No teams registered yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#f7f7fa', borderRadius: 10, overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: '#565EAA', color: '#fff' }}>
                  <th style={{ padding: 12, textAlign: 'left' }}>Team Name</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Category</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Members</th>
                </tr>
              </thead>
              <tbody>
                {participantTeams.map(team => {
                  const members = team.members ? JSON.parse(team.members) : [];
                  return (
                    <tr key={team.id} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: 12 }}>{team.team_name}</td>
                      <td style={{ padding: 12 }}>{team.team_category}</td>
                      <td style={{ padding: 12 }}>
                        {members.length === 0 ? (
                          <span style={{ color: '#888' }}>(No members listed)</span>
                        ) : (
                          members.map((m, i) => <span key={i}>{m.email}{i < members.length - 1 ? ', ' : ''}</span>)
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default TeamRegistrationForm; 