import { FC, useState, useEffect } from "react";
import axios from "axios";
import './App.css';

// Define TypeScript interface for workout data
interface Workout {
    id: number;
    activity: string;
    distance: number;
    pace: string;
}

const App: FC = () => {
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [activity, setActivity] = useState<string>("Run");
    const [distance, setDistance] = useState<string>("");
    const [pace, setPace] = useState<string>("");

    // Fetch workouts on mount
    useEffect(() => {
        const fetchWorkouts = async () => {
            try {
                const response = await axios.get<Workout[]>('http://localhost:5000/workouts');
                setWorkouts(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching workouts:", error);
                setLoading(false);
            }
        };
        fetchWorkouts();
    }, []);

    // Add a new workout
    const handleAddWorkout = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post<Workout>('http://localhost:5000/workouts', {
                activity,
                distance: parseFloat(distance),
                pace
            });
            setWorkouts([...workouts, response.data]);
            setDistance("");
            setPace("");
        } catch (error) {
            console.error("Error adding workout:", error);
        }
    };

    return (
        <>
            <h1>Workout Tracker</h1>
            <form onSubmit={handleAddWorkout}>
                <select value={activity} onChange={(e) => setActivity(e.target.value)}>
                    <option value="Run">Run</option>
                    <option value="Swim">Swim</option>
                    <option value="Walk">Walk</option>
                </select>
                <input
                    type="number"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    placeholder="Distance"
                    required
                />
                <input
                    type="text"
                    value={pace}
                    onChange={(e) => setPace(e.target.value)}
                    placeholder="Pace (MM:SS)"
                    required
                />
                <button type="submit">Add Workout</button>
            </form>
            {loading ? (
                <p>Loading workouts...</p>
            ) : (
                <ul>
                    {workouts.map((workout) => (
                        <li key={workout.id}>
                            {workout.activity} - {workout.distance} {workout.activity === 'Swim' ? 'm' : 'km'} - Pace: {workout.pace}
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
};

export default App;