const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' })); // Matches Vite frontend

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/workout_tracker', {})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schemas
const workoutSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  activity: String,
  distance: Number,
  pace: String,
  notes: String,
  sets: { type: Number, default: 0 },
  reps: { type: Number, default: 0 },
  weight: { type: Number, default: 0 }
});

const goalSchema = new mongoose.Schema({
  activity: String,
  target: Number,
  period: String, // "Weekly" or "Monthly"
  createdAt: { type: Date, default: Date.now }
});

const planSchema = new mongoose.Schema({
  day: String, // "Monday", etc.
  activity: String,
  distance: Number,
  done: { type: Boolean, default: false }
});

const profileSchema = new mongoose.Schema({
  name: String,
  age: Number,
  weight: Number,
  height: Number,
  theme: { type: String, default: 'dark' }
});

// Models
const Workout = mongoose.model('Workout', workoutSchema);
const Goal = mongoose.model('Goal', goalSchema);
const Plan = mongoose.model('Plan', planSchema);
const Profile = mongoose.model('Profile', profileSchema);

// Workouts
app.get('/workouts', async (req, res) => {
  try {
    const { activity } = req.query;
    const filter = activity ? { activity } : {};
    const workouts = await Workout.find(filter).sort({ date: -1 });
    res.json(workouts.map(w => ({ id: w._id.toString(), ...w._doc })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/workouts', async (req, res) => {
  try {
    const workout = new Workout(req.body);
    const saved = await workout.save();
    res.status(201).json({ id: saved._id.toString(), ...saved._doc });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/workouts/:id', async (req, res) => {
  try {
    const updated = await Workout.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Workout not found' });
    res.json({ id: updated._id.toString(), ...updated._doc });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/workouts/:id', async (req, res) => {
  try {
    const deleted = await Workout.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Workout not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Goals
app.get('/goals', async (req, res) => {
  try {
    const goals = await Goal.find();
    res.json(goals.map(g => ({ id: g._id.toString(), ...g._doc })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/goals', async (req, res) => {
  try {
    const goal = new Goal(req.body);
    const saved = await goal.save();
    res.status(201).json({ id: saved._id.toString(), ...saved._doc });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/goals/:id', async (req, res) => {
  try {
    const deleted = await Goal.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Goal not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Plans
app.get('/plans', async (req, res) => {
  try {
    const plans = await Plan.find();
    res.json(plans.map(p => ({ id: p._id.toString(), ...p._doc })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/plans', async (req, res) => {
  try {
    const plan = new Plan(req.body);
    const saved = await plan.save();
    res.status(201).json({ id: saved._id.toString(), ...saved._doc });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/plans/:id', async (req, res) => {
  try {
    const updated = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Plan not found' });
    res.json({ id: updated._id.toString(), ...updated._doc });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/plans/:id', async (req, res) => {
  try {
    const deleted = await Plan.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Plan not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Profile
app.get('/profile', async (req, res) => {
  try {
    let profile = await Profile.findOne();
    if (!profile) {
      profile = new Profile({});
      await profile.save();
    }
    res.json({ id: profile._id.toString(), ...profile._doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/profile', async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json({ id: profile._id.toString(), ...profile._doc });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Stats
app.get('/stats', async (req, res) => {
  try {
    const workouts = await Workout.find();
    const stats = {
      totalDistance: workouts.reduce((sum, w) => sum + (w.distance || 0), 0),
      avgPace: workouts.length ? workouts.reduce((sum, w) => sum + (w.pace ? parsePace(w.pace) : 0), 0) / workouts.length : 0
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function parsePace(pace) {
  if (!pace) return 0;
  const [minutes, seconds] = pace.split(':').map(Number);
  return minutes + seconds / 60;
}

app.listen(5000, () => console.log('Server running on port 5000'));