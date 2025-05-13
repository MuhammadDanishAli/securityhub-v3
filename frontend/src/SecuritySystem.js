import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import './SecuritySystem.css';
import { Chart, LineController, LineElement, PointElement, LinearScale, TimeScale, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
Chart.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Title, Tooltip, Legend);

// Constants
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const clients = [
    {
        id: 1,
        name: 'Ali',
        homes: [
            { siteId: 1, siteType: 'House', address: '123 Main St', zones: { normal: ["Living Room", "Kitchen"], alert: ["Front Door"] } },
            { siteId: 2, siteType: 'Storage', address: '456 Elm St', zones: { normal: ["Storage Room", "Office"], alert: ["Back Door"] } },
        ]
    },
    {
        id: 2,
        name: 'Ahmed',
        homes: [
            { siteId: 3, siteType: 'Shop1', address: '789 Oak St', zones: { normal: ["Main Hall"], alert: ["Shop Entrance"] } },
            { siteId: 4, siteType: 'Shop2', address: '101 Pine St', zones: { normal: ["Cash Counter"], alert: ["Emergency Exit"] } },
        ]
    },
    {
        id: 3,
        name: 'Sara',
        homes: [
            { siteId: 5, siteType: 'Factory', address: '789 Oak St', zones: { normal: ["Gate"], alert: ["Office"] } },
        ]
    }
];

const SecuritySystem = () => {
  const { clientId: siteId } = useParams();
  const [mode, setMode] = useState("Disarm");
  const [sensors, setSensors] = useState({
    pir: { enabled: false, connected: true, value: 0, history: [], pulse: 0, responseTime: 0, uptime: 0 },
    vibration: { enabled: false, connected: true, value: 0, history: [], pulse: 0, responseTime: 0, uptime: 0 },
    dht: { enabled: false, connected: true, temperature: 0, humidity: 0, history: [], pulse: 0, responseTime: 0, uptime: 0 },
  });
  const [notifications, setNotifications] = useState([]);
  const [apiError, setApiError] = useState(null);

  const chartRefs = useMemo(() => ({
    pir: { current: null },
    vibration: { current: null },
    dhtTemp: { current: null },
    dhtHumidity: { current: null },
  }), []);
  const chartInstances = useRef({});

  // Find the home corresponding to the siteId
  const home = clients
    .flatMap(client => client.homes.map(home => ({ ...home, clientId: client.id, clientName: client.name })))
    .find(home => home.siteId === parseInt(siteId));

  const fetchStatus = useCallback(async () => {
    try {
      const startTime = performance.now();
      const response = await fetch(`${API_URL}/api/sensor-status/?client_id=${siteId || '1'}`, {
        headers: {
          "Authorization": `Token ${localStorage.getItem('token')}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      setSensors(prevSensors => {
        const newSensors = { ...prevSensors };
        const currentTime = new Date().getTime();
        const newNotifications = [];

        Object.keys(prevSensors).forEach(sensorKey => {
          newSensors[sensorKey] = { ...prevSensors[sensorKey], uptime: (prevSensors[sensorKey].uptime || 0) + 5 };
        });

        Object.entries(data.data || {}).forEach(([sensorKey, sensorData]) => {
          const previousSensor = prevSensors[sensorKey] || { connected: true, uptime: 0 };
          const wasConnected = previousSensor.connected ?? true;
          const isConnected = sensorData.connected ?? true;

          newSensors[sensorKey] = {
            ...newSensors[sensorKey],
            ...sensorData,
            connected: isConnected,
            responseTime,
            uptime: (previousSensor.uptime || 0) + 5,
          };

          const history = [...(newSensors[sensorKey].history || [])];
          history.push({
            value: sensorData.value || sensorData.temperature || 0,
            timestamp: currentTime,
          });
          if (history.length > 50) history.shift();
          newSensors[sensorKey].history = history;
          newSensors[sensorKey].pulse = history.filter(h => h.timestamp > currentTime - 60000).length;

          if (!isConnected && wasConnected) {
            newNotifications.push(`${sensorKey.toUpperCase()} disconnected at ${new Date().toLocaleTimeString()} for Home ${siteId || '1'}`);
          }
        });

        if (newNotifications.length > 0) {
          setNotifications(prev => [...prev, ...newNotifications]);
        }

        setApiError(null);
        return newSensors;
      });
    } catch (error) {
      console.error("Error fetching sensor status:", error);
      setApiError(`Failed to fetch sensor data for Home ${siteId || '1'}. Please ensure the backend server is running.`);
    }
  }, [siteId]);

  useEffect(() => {
    const initCharts = () => {
      Object.entries(chartRefs).forEach(([key, ref]) => {
        if (ref.current && !chartInstances.current[key]) {
          chartInstances.current[key] = new Chart(ref.current, {
            type: 'line',
            data: {
              labels: [],
              datasets: [{
                label: key.includes('Temp') ? 'Temperature (°C)' : 
                       key.includes('Humidity') ? 'Humidity (%)' : 
                       `${key.toUpperCase()} Value`,
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false,
              }],
            },
            options: {
              responsive: true,
              scales: {
                x: { title: { display: true, text: 'Time', color: 'var(--primary-text)' },
                     ticks: { color: 'var(--primary-text)' } },
                y: { title: { display: true, text: key.includes('Temp') ? 'Temperature (°C)' : 
                                            key.includes('Humidity') ? 'Humidity (%)' : 'Value', color: 'var(--primary-text)' },
                     ticks: { color: 'var(--primary-text)' } },
              },
              plugins: {
                legend: { labels: { color: 'var(--primary-text)' } }
              }
            },
          });
        }
      });
    };

    const updateCharts = () => {
      Object.entries({
        pir: { ref: chartRefs.pir, dataKey: 'value', history: sensors.pir.history },
        vibration: { ref: chartRefs.vibration, dataKey: 'value', history: sensors.vibration.history },
        dhtTemp: { ref: chartRefs.dhtTemp, dataKey: 'temperature', history: sensors.dht.history },
        dhtHumidity: { ref: chartRefs.dhtHumidity, dataKey: 'humidity', history: sensors.dht.history },
      }).forEach(([key, { ref, dataKey, history }]) => {
        if (chartInstances.current[key] && history) {
          chartInstances.current[key].data.labels = history.map(h => 
            new Date(h.timestamp).toLocaleTimeString()
          );
          chartInstances.current[key].data.datasets[0].data = history.map(h => h[dataKey] ?? 0);
          chartInstances.current[key].update();
        }
      });
    };

    initCharts();
    const interval = setInterval(updateCharts, 5000);
    return () => clearInterval(interval);
  }, [sensors, chartRefs]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus, siteId]);

  const handleModeChange = async (newMode) => {
    try {
      const response = await fetch(`${API_URL}/api/mode/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ mode: newMode, client_id: siteId || '1' }),
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.status === "success") setMode(newMode);
    } catch (error) {
      console.error("Error setting mode:", error);
      setApiError("Failed to update system mode. Please ensure the backend server is running.");
    }
  };

  const handleSensorToggle = async (sensor, state) => {
    try {
      const response = await fetch(`${API_URL}/api/sensor/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ sensor_id: sensor, state: state === "on", client_id: siteId || '1' }),
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.status === "success") {
        setSensors(prev => ({
          ...prev,
          [sensor]: { ...prev[sensor], enabled: state === "on" },
        }));
      }
    } catch (error) {
      console.error("Error toggling sensor:", error);
      setApiError("Failed to toggle sensor. Please ensure the backend server is running.");
    }
  };

  if (!home) {
    return <div className="security-system-container">Invalid Site ID</div>;
  }

  return (
    <div className="security-system-container">
      <h1>Security System - {home.siteType} (Site ID: {siteId})</h1>
      {apiError && <div className="api-error">{apiError}</div>}
      <div className="mode-section">
        <h2>System Mode: {mode}</h2>
        <div className="mode-buttons">
          <button 
            className={mode === "Stay" ? "active" : ""}
            onClick={() => handleModeChange("Stay")}
          >
            Stay
          </button>
          <button 
            className={mode === "Away" ? "active" : ""}
            onClick={() => handleModeChange("Away")}
          >
            Away
          </button>
          <button 
            className={mode === "Disarm" ? "active" : ""}
            onClick={() => handleModeChange("Disarm")}
          >
            Disarm
          </button>
        </div>
      </div>
      
      <div className="sensors-section">
        <h2>Sensors</h2>
        {Object.entries(sensors).map(([sensorKey, sensor]) => (
          <div key={sensorKey} className="sensor-item">
            <h3>{sensorKey.toUpperCase()} Sensor</h3>
            <div className="sensor-info">
              <p>Connected: <span className={sensor.connected ? "connected" : "disconnected"}>
                {sensor.connected ? "Yes" : "No"}
              </span></p>
              <p>Enabled: <span className={sensor.enabled ? "enabled" : "disabled"}>
                {sensor.enabled ? "Yes" : "No"}
              </span></p>
              {sensorKey === 'dht' ? (
                <>
                  <p>Temperature: {sensor.temperature ?? 0} °C</p>
                  <p>Humidity: {sensor.humidity ?? 0} %</p>
                </>
              ) : (
                <p>Value: {sensor.value ?? 0}</p>
              )}
              <p>Pulse: {sensor.pulse ?? 0} {sensorKey === 'dht' ? 'updates' : 'triggers'}/min</p>
              <p>Response Time: {(sensor.responseTime ?? 0).toFixed(2) || 0} ms</p>
              <p>Uptime: {((sensor.uptime ?? 0) / 3600).toFixed(2) || 0} hours</p>
            </div>
            
            {sensorKey === 'dht' ? (
              <>
                <canvas ref={chartRefs.dhtTemp} width="400" height="200"></canvas>
                <canvas ref={chartRefs.dhtHumidity} width="400" height="200"></canvas>
              </>
            ) : (
              <canvas ref={chartRefs[sensorKey]} width="400" height="200"></canvas>
            )}
            
            <button 
              className={`toggle-btn ${sensor.enabled ? "enabled" : "disabled"}`}
              onClick={() => handleSensorToggle(sensorKey, sensor.enabled ? "off" : "on")}
            >
              {sensor.enabled ? "Disable" : "Enable"}
            </button>
          </div>
        ))}
      </div>
      
      <div className="notifications-section">
        <h2>Notifications for {home.siteType} (Site ID: {siteId})</h2>
        {notifications.length > 0 ? (
          <ul className="logs-list">
            {notifications.map((notification, index) => (
              <li key={index} className="log-item">
                {notification}
                <button 
                  className="dismiss-btn"
                  onClick={() => setNotifications(prev => prev.filter((_, i) => i !== index))}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-notifications">No new notifications</p>
        )}
      </div>
    </div>
  );
};

export default SecuritySystem;