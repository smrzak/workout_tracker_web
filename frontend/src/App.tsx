import { FC, useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { Tabs, Tab, Box, TextField, Button, Select, MenuItem, FormControl, InputLabel, Typography, Snackbar, IconButton, LinearProgress } from "@mui/material";
import Brightness4Icon from '@mui/icons-material/Brightness4'; // Dark mode icon
import Brightness7Icon from '@mui/icons-material/Brightness7'; // Light mode icon
import "./App.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface Workout {
  id: string;
  date: string;
  activity: string;
  distance: number;
  pace: string;
  notes?: string;
}

interface Goal {
  id: string;
  activity: string;
  target: number;
  period: string;
}

interface Plan {
  id: string;
  day: string;
  activity: string;
  distance: number;
  done: boolean;
}

interface Profile {
  id: string;
  name?: string;
  age?: number;
  weight?: number;
  height?: number;
  theme: string;
}

const App: FC = () => {
  const [tab, setTab] = useState(0);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [theme, setTheme] = useState("dark");
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Log Workout State
  const [activity, setActivity] = useState("Run");
  const [distance, setDistance] = useState("");
  const [pace, setPace] = useState("");
  const [notes, setNotes] = useState("");

  // Goals State
  const [goalActivity, setGoalActivity] = useState("Run");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalPeriod, setGoalPeriod] = useState("Weekly");

  // Plans State
  const [planDay, setPlanDay] = useState("Monday");
  const [planActivity, setPlanActivity] = useState("Run");
  const [planDistance, setPlanDistance] = useState("");

  // Graph Filter State
  const [graphFilter, setGraphFilter] = useState("All");

  useEffect(() => {
    fetchWorkouts();
    fetchGoals();
    fetchPlans();
    fetchProfile();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const response = await axios.get<Workout[]>('http://localhost:5000/workouts');
      setWorkouts(response.data);
    } catch (err) {
      setMessage({ text: "Failed to fetch workouts", type: "error" });
      console.error(err);
    }
  };

  const fetchGoals = async () => {
    try {
      const response = await axios.get<Goal[]>('http://localhost:5000/goals');
      setGoals(response.data);
    } catch (err) {
      setMessage({ text: "Failed to fetch goals", type: "error" });
      console.error(err);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await axios.get<Plan[]>('http://localhost:5000/plans');
      setPlans(response.data);
    } catch (err) {
      setMessage({ text: "Failed to fetch plans", type: "error" });
      console.error(err);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await axios.get<Profile>('http://localhost:5000/profile');
      setProfile(response.data);
      setTheme(response.data.theme);
    } catch (err) {
      setMessage({ text: "Failed to fetch profile", type: "error" });
      console.error(err);
    }
  };

  const isValidPace = (pace: string) => {
    const regex = /^\d{1,2}:\d{2}$/;
    return regex.test(pace);
  };

  const handleLogWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPace(pace)) {
      setMessage({ text: "Invalid pace format. Use MM:SS.", type: "error" });
      return;
    }
    try {
      const newWorkout = { activity, distance: parseFloat(distance), pace, notes, date: new Date().toISOString() };
      await axios.post('http://localhost:5000/workouts', newWorkout);
      fetchWorkouts();
      setDistance("");
      setPace("");
      setNotes("");
      setMessage({ text: "Workout added successfully!", type: "success" });
    } catch (err) {
      setMessage({ text: "Failed to log workout", type: "error" });
      console.error(err);
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    try {
      await axios.delete(`http://localhost:5000/workouts/${id}`);
      fetchWorkouts();
      setMessage({ text: "Workout deleted successfully!", type: "success" });
    } catch (err) {
      setMessage({ text: "Failed to delete workout", type: "error" });
      console.error(err);
    }
  };

  const handleThemeToggle = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (profile) {
      try {
        await axios.put('http://localhost:5000/profile', { ...profile, theme: newTheme });
        fetchProfile();
        setMessage({ text: "Theme updated successfully!", type: "success" });
      } catch (err) {
        setMessage({ text: "Failed to update theme", type: "error" });
        console.error(err);
      }
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newGoal = { activity: goalActivity, target: parseFloat(goalTarget), period: goalPeriod };
      await axios.post('http://localhost:5000/goals', newGoal);
      fetchGoals();
      setGoalTarget("");
      setMessage({ text: "Goal added successfully!", type: "success" });
    } catch (err) {
      setMessage({ text: "Failed to add goal", type: "error" });
      console.error(err);
    }
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newPlan = { day: planDay, activity: planActivity, distance: parseFloat(planDistance), done: false };
      await axios.post('http://localhost:5000/plans', newPlan);
      fetchPlans();
      setPlanDistance("");
      setMessage({ text: "Plan added successfully!", type: "success" });
    } catch (err) {
      setMessage({ text: "Failed to add plan", type: "error" });
      console.error(err);
    }
  };

  const calculateGoalProgress = (goal: Goal) => {
    const now = new Date();
    let startDate;
    if (goal.period === "Weekly") {
      const dayOfWeek = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Monday
      startDate.setHours(0, 0, 0, 0);
    } else { // Monthly
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    const endDate = new Date(); // Now

    const relevantWorkouts = workouts.filter(w =>
      w.activity === goal.activity &&
      new Date(w.date) >= startDate &&
      new Date(w.date) <= endDate
    );

    const sum = relevantWorkouts.reduce((acc, w) => acc + w.distance, 0);
    const progress = (sum / goal.target) * 100;
    return { sum, progress: progress > 100 ? 100 : progress };
  };

  const renderLog = () => (
    <Box className="tab-content">
      <form onSubmit={handleLogWorkout} className="form-container">
        <FormControl fullWidth margin="normal" variant="outlined" className="form-control">
          <InputLabel>Activity</InputLabel>
          <Select value={activity} onChange={(e) => setActivity(e.target.value)} label="Activity">
            <MenuItem value="Run">Run</MenuItem>
            <MenuItem value="Swim">Swim</MenuItem>
            <MenuItem value="Walk">Walk</MenuItem>
          </Select>
        </FormControl>
        <TextField label={`Distance (${activity === 'Swim' ? 'm' : 'km'})`} value={distance} onChange={(e) => setDistance(e.target.value)} fullWidth margin="normal" type="number" required variant="outlined" className="form-control" InputLabelProps={{ shrink: !!distance }} />
        <TextField label={`Pace (MM:SS ${activity === 'Swim' ? 'min/100m' : 'min/km'})`} value={pace} onChange={(e) => setPace(e.target.value)} fullWidth margin="normal" required variant="outlined" className="form-control" InputLabelProps={{ shrink: !!pace }} />
        <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} fullWidth margin="normal" multiline rows={4} variant="outlined" className="form-control" InputLabelProps={{ shrink: !!notes }} />
        <Button type="submit" variant="contained" className="action-button">Log Workout</Button>
      </form>
    </Box>
  );

  const renderHistory = () => (
    <Box className="tab-content">
      <ul className="history-list">
        {workouts.map((w) => (
          <li key={w.id} className="history-item">
            <Typography className="history-text">{new Date(w.date).toLocaleString()} - {w.activity} - {w.distance} {w.activity === 'Swim' ? 'm' : 'km'} - Pace: {w.pace} - {w.notes || 'No notes'}</Typography>
            <Button onClick={() => handleDeleteWorkout(w.id)} variant="outlined" className="delete-button">Delete</Button>
          </li>
        ))}
      </ul>
    </Box>
  );

  const renderGraphs = () => {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.setFullYear(now.getFullYear() - 1));
    const filteredWorkouts = workouts.filter(w => new Date(w.date) >= twelveMonthsAgo && (graphFilter === "All" || w.activity === graphFilter));
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    }).reverse();

    const datasets = [
      { label: "Run", data: months.map(m => filteredWorkouts.filter(w => w.activity === "Run" && new Date(w.date).toLocaleString('default', { month: 'short', year: 'numeric' }) === m).reduce((sum, w) => sum + w.distance, 0)), borderColor: "#FF5733", hidden: graphFilter !== "All" && graphFilter !== "Run" },
      { label: "Swim", data: months.map(m => filteredWorkouts.filter(w => w.activity === "Swim" && new Date(w.date).toLocaleString('default', { month: 'short', year: 'numeric' }) === m).reduce((sum, w) => sum + w.distance, 0)), borderColor: "#00C4B4", hidden: graphFilter !== "All" && graphFilter !== "Swim" },
      { label: "Walk", data: months.map(m => filteredWorkouts.filter(w => w.activity === "Walk" && new Date(w.date).toLocaleString('default', { month: 'short', year: 'numeric' }) === m).reduce((sum, w) => sum + w.distance, 0)), borderColor: "#FFC107", hidden: graphFilter !== "All" && graphFilter !== "Walk" },
    ];

    const data = { labels: months, datasets };
    return (
      <Box className="graph-container">
        <FormControl fullWidth margin="normal" variant="outlined" className="form-control">
          <InputLabel>Filter Activity</InputLabel>
          <Select value={graphFilter} onChange={(e) => setGraphFilter(e.target.value)} label="Filter Activity">
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Run">Run</MenuItem>
            <MenuItem value="Swim">Swim</MenuItem>
            <MenuItem value="Walk">Walk</MenuItem>
          </Select>
        </FormControl>
        <Line data={data} options={{ 
          responsive: true, 
          maintainAspectRatio: true,
          scales: {
            y: { ticks: { color: theme === 'dark' ? '#FFFFFF' : '#1A202C' } },
            x: { ticks: { color: theme === 'dark' ? '#FFFFFF' : '#1A202C' } }
          }
        }} />
      </Box>
    );
  };

  const renderStats = () => {
    const runWorkouts = workouts.filter(w => w.activity === "Run");
    const swimWorkouts = workouts.filter(w => w.activity === "Swim");
    const walkWorkouts = workouts.filter(w => w.activity === "Walk");

    const totalRunDistance = runWorkouts.reduce((sum, w) => sum + w.distance, 0);
    const totalSwimDistance = swimWorkouts.reduce((sum, w) => sum + w.distance, 0);
    const totalWalkDistance = walkWorkouts.reduce((sum, w) => sum + w.distance, 0);

    const avgRunDistance = runWorkouts.length ? totalRunDistance / runWorkouts.length : 0;
    const avgSwimDistance = swimWorkouts.length ? totalSwimDistance / swimWorkouts.length : 0;
    const avgWalkDistance = walkWorkouts.length ? totalWalkDistance / walkWorkouts.length : 0;

    return (
      <Box className="tab-content">
        <Box className="stats-section">
          <Typography>Run Stats:</Typography>
          <Typography>Total Workouts: {runWorkouts.length}</Typography>
          <Typography>Total Distance: {totalRunDistance.toFixed(2)} km</Typography>
          <Typography>Average Distance: {avgRunDistance.toFixed(2)} km</Typography>
        </Box>
        <Box className="stats-section">
          <Typography>Swim Stats:</Typography>
          <Typography>Total Workouts: {swimWorkouts.length}</Typography>
          <Typography>Total Distance: {totalSwimDistance.toFixed(2)} m</Typography>
          <Typography>Average Distance: {avgSwimDistance.toFixed(2)} m</Typography>
        </Box>
        <Box className="stats-section">
          <Typography>Walk Stats:</Typography>
          <Typography>Total Workouts: {walkWorkouts.length}</Typography>
          <Typography>Total Distance: {totalWalkDistance.toFixed(2)} km</Typography>
          <Typography>Average Distance: {avgWalkDistance.toFixed(2)} km</Typography>
        </Box>
      </Box>
    );
  };

  const renderGoals = () => (
    <Box className="tab-content">
      <form onSubmit={handleAddGoal} className="form-container">
        <FormControl fullWidth margin="normal" variant="outlined" className="form-control">
          <InputLabel>Activity</InputLabel>
          <Select value={goalActivity} onChange={(e) => setGoalActivity(e.target.value)} label="Activity">
            <MenuItem value="Run">Run</MenuItem>
            <MenuItem value="Swim">Swim</MenuItem>
            <MenuItem value="Walk">Walk</MenuItem>
          </Select>
        </FormControl>
        <TextField label={`Target (${goalActivity === 'Swim' ? 'm' : 'km'})`} value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} fullWidth margin="normal" type="number" required variant="outlined" className="form-control" InputLabelProps={{ shrink: !!goalTarget }} />
        <FormControl fullWidth margin="normal" variant="outlined" className="form-control">
          <InputLabel>Period</InputLabel>
          <Select value={goalPeriod} onChange={(e) => setGoalPeriod(e.target.value)} label="Period">
            <MenuItem value="Weekly">Weekly</MenuItem>
            <MenuItem value="Monthly">Monthly</MenuItem>
          </Select>
        </FormControl>
        <Button type="submit" variant="contained" className="action-button">Add Goal</Button>
      </form>
      <ul className="list">
        {goals.map(g => {
          const { sum, progress } = calculateGoalProgress(g);
          return (
            <li key={g.id} className="list-item">
              {g.activity} - {g.target} {g.activity === 'Swim' ? 'm' : 'km'} - {g.period}
              <Box sx={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress variant="determinate" value={progress} />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                  <Typography variant="body2">{`${Math.round(progress)}%`}</Typography>
                </Box>
              </Box>
              <Typography>{`${sum.toFixed(2)} / ${g.target} ${g.activity === 'Swim' ? 'm' : 'km'}`}</Typography>
              <Button onClick={() => axios.delete(`http://localhost:5000/goals/${g.id}`).then(() => { fetchGoals(); setMessage({ text: "Goal deleted successfully!", type: "success" }); })} variant="outlined" className="delete-button">Delete</Button>
            </li>
          );
        })}
      </ul>
    </Box>
  );

  const renderPlans = () => (
    <Box className="tab-content">
      <form onSubmit={handleAddPlan} className="form-container">
        <FormControl fullWidth margin="normal" variant="outlined" className="form-control">
          <InputLabel>Day</InputLabel>
          <Select value={planDay} onChange={(e) => setPlanDay(e.target.value)} label="Day">
            <MenuItem value="Monday">Monday</MenuItem>
            <MenuItem value="Tuesday">Tuesday</MenuItem>
            <MenuItem value="Wednesday">Wednesday</MenuItem>
            <MenuItem value="Thursday">Thursday</MenuItem>
            <MenuItem value="Friday">Friday</MenuItem>
            <MenuItem value="Saturday">Saturday</MenuItem>
            <MenuItem value="Sunday">Sunday</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal" variant="outlined" className="form-control">
          <InputLabel>Activity</InputLabel>
          <Select value={planActivity} onChange={(e) => setPlanActivity(e.target.value)} label="Activity">
            <MenuItem value="Run">Run</MenuItem>
            <MenuItem value="Swim">Swim</MenuItem>
            <MenuItem value="Walk">Walk</MenuItem>
          </Select>
        </FormControl>
        <TextField label={`Distance (${planActivity === 'Swim' ? 'm' : 'km'})`} value={planDistance} onChange={(e) => setPlanDistance(e.target.value)} fullWidth margin="normal" type="number" required variant="outlined" className="form-control" InputLabelProps={{ shrink: !!planDistance }} />
        <Button type="submit" variant="contained" className="action-button">Add Plan</Button>
      </form>
      <ul className="list">
        {plans.map(p => (
          <li key={p.id} className="list-item">
            {p.day} - {p.activity} - {p.distance} {p.activity === 'Swim' ? 'm' : 'km'} - {p.done ? 'Done' : 'Pending'}
            <Button onClick={() => axios.put(`http://localhost:5000/plans/${p.id}`, { ...p, done: !p.done }).then(() => { fetchPlans(); setMessage({ text: "Plan updated successfully!", type: "success" }); })} variant="outlined" className="toggle-button">Toggle</Button>
          </li>
        ))}
      </ul>
    </Box>
  );

  const renderProfile = () => (
    <Box className="tab-content">
      <TextField label="Name" value={profile?.name || ''} onChange={(e) => setProfile({ ...profile!, name: e.target.value })} fullWidth margin="normal" variant="outlined" className="form-control" InputLabelProps={{ shrink: !!profile?.name }} />
      <TextField label="Age" value={profile?.age || ''} onChange={(e) => setProfile({ ...profile!, age: parseInt(e.target.value) || undefined })} fullWidth margin="normal" type="number" variant="outlined" className="form-control" InputLabelProps={{ shrink: !!profile?.age }} />
      <TextField label="Weight (kg)" value={profile?.weight || ''} onChange={(e) => setProfile({ ...profile!, weight: parseFloat(e.target.value) || undefined })} fullWidth margin="normal" type="number" variant="outlined" className="form-control" InputLabelProps={{ shrink: !!profile?.weight }} />
      <TextField label="Height (cm)" value={profile?.height || ''} onChange={(e) => setProfile({ ...profile!, height: parseFloat(e.target.value) || undefined })} fullWidth margin="normal" type="number" variant="outlined" className="form-control" InputLabelProps={{ shrink: !!profile?.height }} />
      <Button onClick={() => axios.put('http://localhost:5000/profile', profile).then(() => { fetchProfile(); setMessage({ text: "Profile saved successfully!", type: "success" }); })} variant="contained" className="action-button">Save</Button>
    </Box>
  );

  return (
    <Box className={`app-container ${theme}`}>
      <Box className="tabs-container">
        <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)} variant="scrollable" scrollButtons="auto" className="tabs">
          <Tab label="Log" />
          <Tab label="History" />
          <Tab label="Graphs" />
          <Tab label="Stats" />
          <Tab label="Goals" />
          <Tab label="Plans" />
          <Tab label="Profile" />
        </Tabs>
        <IconButton onClick={handleThemeToggle} className="theme-icon">
          {theme === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Box>
      {tab === 0 && renderLog()}
      {tab === 1 && renderHistory()}
      {tab === 2 && renderGraphs()}
      {tab === 3 && renderStats()}
      {tab === 4 && renderGoals()}
      {tab === 5 && renderPlans()}
      {tab === 6 && renderProfile()}
      <Snackbar open={!!message} autoHideDuration={3000} onClose={() => setMessage(null)} message={message?.text} ContentProps={{ className: message?.type === 'success' ? 'snackbar-success' : 'snackbar-error' }} />
    </Box>
  );
};

export default App;