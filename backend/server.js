const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors()); // Allow frontend to connect

// Sample workout data (replace with database later)
let workouts = [
    { id: 1, activity: 'Run', distance: 5, pace: '5:00' }
];

// GET route to fetch workouts
app.get('/workouts', (req, res) => {
    res.json(workouts);
});

// POST route to add a workout
app.post('/workouts', (req, res) => {
    const { activity, distance, pace } = req.body;
    const newWorkout = { id: Date.now(), activity, distance, pace };
    workouts.push(newWorkout);
    res.json(newWorkout);
});

app.listen(5000, () => console.log('Server running on port 5000'));