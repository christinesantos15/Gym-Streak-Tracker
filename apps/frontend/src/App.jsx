import React, { useState, useEffect } from "react";

// Automatically detects if running locally or deployed live on an AWS EC2 Public IP
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8080'
  : `http://${window.location.hostname}:8080`;

export default function App() {
  const [workouts, setWorkouts] = useState([]);
  const [exerciseName, setExerciseName] = useState("");
  const [repetitions, setRepetitions] = useState("");
  const [sets, setSets] = useState("");
  const [streak, setStreak] = useState({ current_streak: 0, last_workout_date: null });
  const [filterDate, setFilterDate] = useState("");

  const updateDashboardData = async () => {
    try {
      const streakRes = await fetch(`${API_URL}/streak`);
      const streakData = await streakRes.json();
      setStreak(streakData);

      const logsRes = await fetch(`${API_URL}/workouts`);
      const logsData = await logsRes.json();
      setWorkouts(logsData);
    } catch (err) {
      console.error("Connection down: ", err);
    }
  };

  useEffect(() => {
    updateDashboardData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!exerciseName.trim() || !sets || !repetitions) return;

    const payload = {
      exercise_name: exerciseName.trim(),
      sets: parseInt(sets, 10),
      repetitions: parseInt(repetitions, 10)
    };

    try {
      const response = await fetch(`${API_URL}/workouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setExerciseName("");
        setSets("");
        setRepetitions("");
        updateDashboardData();
      }
    } catch (err) {
      console.error("Error creating log:", err);
    }
  };

  const deleteWorkout = async (id) => {
    if (window.confirm("Are you sure you want to remove this log entry?")) {
      try {
        const response = await fetch(`${API_URL}/workouts/${id}`, { method: "DELETE" });
        if (response.ok) {
          updateDashboardData();
        }
      } catch (err) {
        console.error("Error deleting log:", err);
      }
    }
  };

  const filteredLogs = workouts.filter((item) => {
    if (!filterDate) return true;
    const logDateISO = new Date(item.logged_date).toISOString().split("T")[0];
    return logDateISO === filterDate;
  });

  return (
    <div className="bg-slate-900 text-slate-100 font-sans min-h-screen">
      <div className="container mx-auto p-6 max-w-5xl">
        
        {/* Main Banner Header */}
        <header className="flex justify-between items-center mb-10 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
              ⚡ Gym Repetition & Streak Tracker
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              A real-time performance logging engine calculating dynamic daily engagement streaks.
            </p>
          </div>
        </header>

        {/* Dynamic Metric Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/10 p-6 rounded-xl border border-orange-500/30 flex items-center justify-between shadow-lg">
            <div>
              <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Current Training Streak</h3>
              <p className="text-5xl font-black text-orange-400 mt-1">
                {streak.current_streak} Day{streak.current_streak === 1 ? "" : "s"}
              </p>
            </div>
            <div className="text-4xl">🔥</div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center justify-between shadow-lg">
            <div>
              <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Last Tracked Session</h3>
              <p className="text-xl font-mono text-slate-200 mt-2">
                {streak.last_workout_date ? streak.last_workout_date : "None Recorded"}
              </p>
            </div>
            <div className="text-4xl">📅</div>
          </div>
        </div>

        {/* Form and History Output Flow Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Workouts Form Panel */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl h-fit">
            <h2 className="text-lg font-semibold mb-4 text-slate-200">Log Repetitions</h2>
            <form onSubmit={handleSubmit