const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' })); 

// Connect to MongoDB running in Docker
mongoose.connect('mongodb://127.0.0.1:27017/workout_tracker', {
}).then(() => {
  console.log('MongoDB connected successfully');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Define Workout schema
const workoutSchema = new mongoose.Schema({
  activity: String,
  distance: Number,
  pace: String
});
const Workout = mongoose.model('Workout', workoutSchema);

// GET all workouts
app.get('/workouts', async (req, res) => {
  try {
    const workouts = await Workout.find();
    const transformedWorkouts = workouts.map(workout => ({
      id: workout._id.toString(),
      activity: workout.activity,
      distance: workout.distance,
      pace: workout.pace
    }));
    res.json(transformedWorkouts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new workout
app.post('/workouts', async (req, res) => {
  const { activity, distance, pace } = req.body;
  const workout = new Workout({ activity, distance, pace });
  
  try {
    const savedWorkout = await workout.save();
    res.status(201).json({
      id: savedWorkout._id.toString(),
      activity: savedWorkout.activity,
      distance: savedWorkout.distance,
      pace: savedWorkout.pace
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(5000, () => console.log('Server running on port 5000'));