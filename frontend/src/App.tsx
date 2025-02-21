import { FC, useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { Tabs, Tab, Box, TextField, Button, Select, MenuItem, FormControl, InputLabel, Typography, Snackbar } from "@mui/material";
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

  const [activity, setActivity] = useState("Run");
  const [distance, setDistance] = useState("");
  const [pace, setPace] = useState("");
  const [notes, setNotes] = useState("");

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

  const handleLogWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const renderLog = () => (
    <Box className="tab-content">
      <form onSubmit={handleLogWorkout} className="form-container">
        <FormControl fullWidth margin="normal" className="form-control">
          <InputLabel shrink>Activity</InputLabel>
          <Select value={activity} onChange={(e) => setActivity(e.target.value)}>
            <MenuItem value="Run">Run</MenuItem>
            <MenuItem value="Swim">Swim</MenuItem>
            <MenuItem value="Walk">Walk</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label={`Distance (${activity === 'Swim' ? 'm' : 'km'})`}
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          fullWidth
          margin="normal"
          type="number"
          required
          className="form-control"
        />
        <TextField
          label={`Pace (MM:SS ${activity === 'Swim' ? 'min/100m' : 'min/km'})`}
          value={pace}
          onChange={(e) => setPace(e.target.value)}
          fullWidth
          margin="normal"
          required
          className="form-control"
        />
        <TextField
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          fullWidth
          margin="normal"
          className="form-control"
        />
        <Button type="submit" variant="contained" className="action-button">Log Workout</Button>
      </form>
    </Box>
  );

  const renderHistory = () => (
    <Box className="tab-content">
      <ul className="history-list">
        {workouts.map((w) => (
          <li key={w.id} className="history-item">
            <Typography className="history-text">
              {new Date(w.date).toLocaleString()} - {w.activity} - {w.distance} {w.activity === 'Swim' ? 'm' : 'km'} - Pace: {w.pace} - {w.notes || 'No notes'}
            </Typography>
            <Button onClick={() => handleDeleteWorkout(w.id)} variant="outlined" className="delete-button">Delete</Button>
          </li>
        ))}
      </ul>
    </Box>
  );

  const renderGraphs = () => {
    const data = {
      labels: workouts.map(w => new Date(w.date).toLocaleDateString()),
      datasets: [{
        label: 'Distance',
        data: workouts.map(w => w.distance),
        borderColor: '#3498DB',
        fill: false,
      }]
    };
    return <Line data={data} options={{ responsive: true, maintainAspectRatio: false }} className="graph" />;
  };

  const renderStats = () => {
    const totalDistance = workouts.reduce((sum, w) => sum + w.distance, 0);
    return (
      <Box className="tab-content">
        <Typography>Total Distance: {totalDistance} {activity === 'Swim' ? 'm' : 'km'}</Typography>
      </Box>
    );
  };

  const renderGoals = () => (
    <Box className="tab-content">
      <ul className="list">
        {goals.map(g => (
          <li key={g.id} className="list-item">
            {g.activity} - {g.target} {g.activity === 'Swim' ? 'm' : 'km'} - {g.period}
            <Button onClick={() => axios.delete(`http://localhost:5000/goals/${g.id}`).then(() => {
              fetchGoals();
              setMessage({ text: "Goal deleted successfully!", type: "success" });
            })} variant="outlined" className="delete-button">Delete</Button>
          </li>
        ))}
      </ul>
    </Box>
  );

  const renderPlans = () => (
    <Box className="tab-content">
      <ul className="list">
        {plans.map(p => (
          <li key={p.id} className="list-item">
            {p.day} - {p.activity} - {p.distance} {p.activity === 'Swim' ? 'm' : 'km'} - {p.done ? 'Done' : 'Pending'}
            <Button onClick={() => axios.put(`http://localhost:5000/plans/${p.id}`, { ...p, done: !p.done }).then(() => {
              fetchPlans();
              setMessage({ text: "Plan updated successfully!", type: "success" });
            })} variant="outlined" className="toggle-button">Toggle</Button>
          </li>
        ))}
      </ul>
    </Box>
  );

  const renderProfile = () => (
    <Box className="tab-content">
      <TextField
        label="Name"
        value={profile?.name || ''}
        onChange={(e) => setProfile({ ...profile!, name: e.target.value })}
        fullWidth
        margin="normal"
        className="form-control"
      />
      <TextField
        label="Age"
        value={profile?.age || ''}
        onChange={(e) => setProfile({ ...profile!, age: parseInt(e.target.value) || undefined })}
        fullWidth
        margin="normal"
        type="number"
        className="form-control"
      />
      <TextField
        label="Weight (kg)"
        value={profile?.weight || ''}
        onChange={(e) => setProfile({ ...profile!, weight: parseFloat(e.target.value) || undefined })}
        fullWidth
        margin="normal"
        type="number"
        className="form-control"
      />
      <TextField
        label="Height (cm)"
        value={profile?.height || ''}
        onChange={(e) => setProfile({ ...profile!, height: parseFloat(e.target.value) || undefined })}
        fullWidth
        margin="normal"
        type="number"
        className="form-control"
      />
      <Button onClick={() => axios.put('http://localhost:5000/profile', profile).then(() => {
        fetchProfile();
        setMessage({ text: "Profile saved successfully!", type: "success" });
      })} variant="contained" className="action-button">Save</Button>
    </Box>
  );

  return (
    <Box className={`app-container ${theme}`}>
      <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)} centered className="tabs" variant="scrollable" scrollButtons="auto">
        <Tab label="Log" />
        <Tab label="History" />
        <Tab label="Graphs" />
        <Tab label="Stats" />
        <Tab label="Goals" />
        <Tab label="Plans" />
        <Tab label="Profile" />
      </Tabs>
      {tab === 0 && renderLog()}
      {tab === 1 && renderHistory()}
      {tab === 2 && renderGraphs()}
      {tab === 3 && renderStats()}
      {tab === 4 && renderGoals()}
      {tab === 5 && renderPlans()}
      {tab === 6 && renderProfile()}
      <Box className="theme-toggle">
        <Button onClick={handleThemeToggle} variant="outlined">
          Switch to {theme === 'dark' ? 'Light' : 'Dark'} Theme
        </Button>
      </Box>
      <Snackbar
        open={!!message}
        autoHideDuration={3000}
        onClose={() => setMessage(null)}
        message={message?.text}
        ContentProps={{
          className: message?.type === 'success' ? 'snackbar-success' : 'snackbar-error'
        }}
      />
    </Box>
  );
};

export default App;