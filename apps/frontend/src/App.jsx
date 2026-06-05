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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-medium text-slate-400 mb-1">Exercise Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Push-ups, Squats"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-medium text-slate-400 mb-1">Sets</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="4"
                    value={sets}
                    onChange={(e) => setSets(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-medium text-slate-400 mb-1">Reps per Set</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="12"
                    value={repetitions}
                    onChange={(e) => setRepetitions(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold py-3 rounded-lg shadow-md hover:opacity-90 transition"
              >
                Commit Workout Log
              </button>
            </form>
          </div>

          {/* Database History Table Display */}
          <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-lg font-semibold text-slate-200">Workout History Logs</h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-xs font-mono text-slate-400 uppercase">Filter Date:</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setFilterDate("")}
                  className="text-xs text-slate-400 hover:text-white bg-slate-700 px-2 py-1 rounded transition"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase font-mono">
                    <th className="pb-3">Exercise</th>
                    <th className="pb-3">Volume</th>
                    <th className="pb-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-8 text-center text-slate-500 font-mono">
                        No logged workouts found for this selection.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((item) => {
                      const timeString = new Date(item.logged_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                      const dateString = new Date(item.logged_date).toLocaleDateString([], { month: "short", day: "numeric" });
                      return (
                        <tr key={item.id} className="hover:bg-slate-700/20 transition group">
                          <td className="py-4 font-semibold text-white">{item.exercise_name}</td>
                          <td className="py-4 font-mono text-amber-400">{item.sets} sets × {item.repetitions} reps</td>
                          <td className="py-4 text-right space-x-3 whitespace-nowrap">
                            <span className="text-slate-400 text-xs font-mono">{dateString} @ {timeString}</span>
                            <button
                              type="button"
                              onClick={() => deleteWorkout(item.id)}
                              className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-400 font-medium text-xs border border-rose-500/20 hover:border-rose-500/50 bg-rose-500/10 px-2 py-1 rounded transition-opacity duration-200"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}