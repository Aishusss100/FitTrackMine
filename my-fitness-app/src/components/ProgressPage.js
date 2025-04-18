import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "./ProgressPage.css";

// Register Chart.js components
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const ProgressPage = () => {
  const [exerciseList, setExerciseList] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [viewType, setViewType] = useState("daily");
  const [progressData, setProgressData] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/get_exercises", {
          withCredentials: true,
        });
        setExerciseList(response.data);
        if (response.data.length > 0) {
          setSelectedExercise(response.data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch exercises:", error);
        setErrorMessage("Failed to load exercises. Please try again.");
      }
    };

    fetchExercises();
  }, []);

  useEffect(() => {
    if (!selectedExercise) return;

    const fetchProgressData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get("http://localhost:5000/api/get_progress", {
          params: { view_type: viewType, exercise_name: selectedExercise },
          withCredentials: true,
        });

        setProgressData(response.data);
        setErrorMessage("");
      } catch (error) {
        console.error("Failed to fetch progress data:", error);
        setErrorMessage("Failed to load progress data. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgressData();
  }, [viewType, selectedExercise]);

  // Format seconds to min:sec format
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const chartData = {
    labels: progressData.map((entry) => entry.date),
    datasets: [
      {
        label: "Reps",
        data: progressData.map((entry) => entry.reps),
        borderColor: "rgba(75,192,192,1)",
        backgroundColor: "rgba(75,192,192,0.2)",
        fill: true,
      },
      {
        label: "Duration (s)",
        data: progressData.map((entry) => entry.duration),
        borderColor: "rgba(153,102,255,1)",
        backgroundColor: "rgba(153,102,255,0.2)",
        fill: true,
      },
      {
        label: "Efficiency",
        data: progressData.map((entry) => entry.reps / entry.duration),
        borderColor: "rgba(255,206,86,1)",
        backgroundColor: "rgba(255,206,86,0.2)",
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
      tooltip: {
        titleFont: {
          size: 16
        },
        bodyFont: {
          size: 14
        },
        padding: 10
      }
    }
  };

  return (
    <div className="progress-page">
      <div className="two-column-layout">
        {/* Left Column - Controls */}
        <div className="left-column">
          {/* Exercise Selector */}
          <div className="exercise-selector">
            <label htmlFor="exercise">Select Exercise:</label>
            <select
              id="exercise"
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
            >
              {exerciseList.map((exercise, index) => (
                <option key={index} value={exercise}>
                  {exercise.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* View Selector */}
          <div className="view-selector">
            <button
              className={viewType === "daily" ? "active" : ""}
              onClick={() => setViewType("daily")}
            >
              Daily
            </button>
            <button
              className={viewType === "weekly" ? "active" : ""}
              onClick={() => setViewType("weekly")}
            >
              Last 7 days
            </button>
            <button
              className={viewType === "monthly" ? "active" : ""}
              onClick={() => setViewType("monthly")}
            >
              Last 30 days
            </button>
          </div>
        </div>

        {/* Right Column - Content Display */}
        <div className="right-column">
          {/* Loading Indicator */}
          {isLoading && <div className="loading-message">Loading...</div>}

          {/* Error Messages */}
          {errorMessage && <div className="error-message">{errorMessage}</div>}

          {!isLoading && progressData.length > 0 && viewType === "daily" && (
            <div className="daily-details">
              {progressData.map((entry, index) => (
                <div key={index} className="progress-item">
                  <p>
                    <strong>Date:</strong> {entry.date}
                  </p>
                  <p>
                    <strong>Reps:</strong> {entry.reps}
                  </p>
                  <p>
                    <strong>Duration:</strong> {formatDuration(entry.duration)}
                  </p>
                  <p>
                    <strong>Efficiency:</strong> {(entry.reps / entry.duration).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {!isLoading && progressData.length > 0 && viewType !== "daily" && (
            <div className="chart-container">
              <Line
                key={selectedExercise + viewType} // Forces rerender on state changes
                data={chartData}
                options={chartOptions}
              />
            </div>
          )}

          {!isLoading && progressData.length === 0 && !errorMessage && (
            <div className="no-data-message">No progress data available for this selection.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;