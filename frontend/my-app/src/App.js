import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { BrowserRouter as Router, Route, Routes, Link, Navigate, useParams } from 'react-router-dom';
import './App.css';
import './SecuritySystem.css';
import { FaUserCircle, FaSignOutAlt, FaBars, FaHome, FaCaretDown } from 'react-icons/fa';
import Chart from 'chart.js/auto';

// Components
import Home from './Home';
import LoginPage from './LoginPage';
import ManageUsers from './ManageUsers';
import SecuritySettings from './SecuritySettings';
import HelpSupport from './HelpSupport';
import SuperUser from './SuperUser';
import Systemlog from './Systemlog';
import Sdata from './Sdata';

// Home Wrapper Component to use useParams
const HomeWrapper = () => {
  const { clientId } = useParams();
  return <Home clientId={clientId} />;
};

// Constants
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const clients = [
  { id: 1, name: 'Home 1' },
  { id: 2, name: 'Home 2' },
];

// PrivateRoute Component
const PrivateRoute = ({ children, isLoggedIn, userRole, requiredRole }) => {
  console.log("PrivateRoute:", { isLoggedIn, userRole, requiredRole });
  if (!isLoggedIn) {
    console.log("Redirecting to /login due to not logged in");
    return <Navigate to="/login" replace />;
  }
  if (requiredRole && userRole !== requiredRole) {
    console.log("Redirecting to /home/1 due to role mismatch");
    return <Navigate to="/home/1" replace />;
  }
  return children;
};

// SecuritySystem Component
const SecuritySystem = () => {
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

  const fetchStatus = useCallback(async () => {
    try {
      const startTime = performance.now();
      const response = await fetch(`${API_URL}/api/sensor-status/`, {
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

        Object.entries(data).forEach(([sensorKey, sensorData]) => {
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
            newNotifications.push(`${sensorKey.toUpperCase()} disconnected at ${new Date().toLocaleTimeString()}`);
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
      setApiError("Failed to fetch sensor data. Please ensure the backend server is running.");
    }
  }, []);

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
                x: { title: { display: true, text: 'Time' } },
                y: { title: { display: true, text: key.includes('Temp') ? 'Temperature (°C)' : 
                                            key.includes('Humidity') ? 'Humidity (%)' : 'Value' } },
              },
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
  }, [fetchStatus]);

  const handleModeChange = async (newMode) => {
    try {
      const response = await fetch(`${API_URL}/api/mode/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ mode: newMode }),
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
        body: JSON.stringify({ sensor_id: sensor, state: state === "on" }),
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

  return (
    <div className="security-system-container">
      <h1>Security System</h1>
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
              <p>Response Time: {(sensor.responseTime ?? 0).toFixed(2)} ms</p>
              <p>Uptime: {((sensor.uptime ?? 0) / 3600).toFixed(2)} hours</p>
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
        <h2>Notifications</h2>
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

// NavBar Component
const NavBar = ({
  isLoggedIn,
  userName,
  userRole,
  isNavOpen,
  isHomesDropdownOpen,
  onLogout,
  onToggleNav,
  onToggleHomesDropdown
}) => {
  return (
    <nav className="nav-bar">
      <div className="nav-logo">
        <Link to={isLoggedIn ? "/home/1" : "/login"}>Security System</Link>
      </div>
      
      {/* Login Time Display */}
      {isLoggedIn && (
        <div className="login-time">
          Login Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
      
      <button className="nav-toggle" onClick={onToggleNav}>
        <FaBars />
      </button>
      
      <div className="main-nav-links">
        {isLoggedIn ? (
          <>
            <div className="nav-left">
              <div className="dropdown">
                <button className="dropdown-toggle" onClick={onToggleHomesDropdown}>
                  <FaHome /> Homes <FaCaretDown />
                </button>
                <div className={`dropdown-menu ${isHomesDropdownOpen ? 'show' : ''}`}>
                  {clients.map(client => (
                    <Link
                      key={client.id}
                      to={`/home/${client.id}`}
                      onClick={() => {
                        console.log(`Navigating to /home/${client.id}`);
                        onToggleHomesDropdown();
                        onToggleNav();
                      }}
                      className="nav-link"
                    >
                      {client.name}
                    </Link>
                  ))}
                  {userRole === 'admin' && (
                    <>
                      <Link
                        to="/superuser"
                        onClick={() => {
                          console.log("Navigating to /superuser");
                          onToggleHomesDropdown();
                          onToggleNav();
                        }}
                        className="nav-link"
                      >
                        Superuser
                      </Link>
                      <Link
                        to="/manage-users"
                        onClick={() => {
                          console.log("Navigating to /manage-users");
                          onToggleHomesDropdown();
                          onToggleNav();
                        }}
                        className="nav-link"
                      >
                        Manage Users
                      </Link>
                    </>
                  )}
                </div>
              </div>
              <Link to="/security-system" className="nav-link">
                Security System
              </Link>
            </div>
            <div className="nav-right">
              <span className="user-info">
                <FaUserCircle /> {userName}
              </span>
              <button className="logout-btn" onClick={onLogout}>
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </>
        ) : (
          <Link to="/login" className="nav-link">Login</Link>
        )}
      </div>

      <div className={`mobile-nav-links ${isNavOpen ? 'active' : ''}`}>
        {isLoggedIn && (
          <>
            <div className="mobile-nav-section">
              <h3>Homes</h3>
              {clients.map(client => (
                <Link
                  key={client.id}
                  to={`/home/${client.id}`}
                  onClick={() => {
                    console.log(`Mobile: Navigating to /home/${client.id}`);
                    onToggleNav();
                  }}
                  className="mobile-nav-item"
                >
                  {client.name}
                </Link>
              ))}
            </div>
            <div className="mobile-nav-section">
              <h3>System</h3>
              <Link to="/security-system" onClick={onToggleNav} className="mobile-nav-item">
                Security System
              </Link>
              {userRole === 'admin' && (
                <>
                  <Link
                    to="/superuser"
                    onClick={onToggleNav}
                    className="mobile-nav-item"
                  >
                    Superuser
                  </Link>
                  <Link
                    to="/manage-users"
                    onClick={onToggleNav}
                    className="mobile-nav-item"
                  >
                    Manage Users
                  </Link>
                </>
              )}
            </div>
            <button className="mobile-nav-item logout-btn" onClick={onLogout}>
              <FaSignOutAlt /> Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

// Main App Component
const App = () => {
  const [auth, setAuth] = useState({
    isLoggedIn: false,
    userRole: null,
    userName: '',
  });
  const [uiState, setUiState] = useState({
    isNavOpen: false,
    isHomesDropdownOpen: false,
  });

  useEffect(() => {
    const storedAuth = {
      isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
      userRole: localStorage.getItem('userRole'),
      userName: localStorage.getItem('userName'),
    };

    if (storedAuth.isLoggedIn && storedAuth.userRole && storedAuth.userName && localStorage.getItem('token')) {
      setAuth(storedAuth);
      console.log("Loaded auth state:", storedAuth);
    } else {
      clearAuthData();
    }
  }, []);

  const clearAuthData = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('token');
    setAuth({ isLoggedIn: false, userRole: null, userName: '' });
  };

  const handleLogin = async (token, username, role) => {
    const userData = {
      isLoggedIn: true,
      userRole: role || 'user',
      userName: username,
    };
    
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', userData.userRole);
    localStorage.setItem('userName', username);
    localStorage.setItem('token', token);
    
    setAuth(userData);
    console.log("Logged in with role:", userData.userRole);
  };

  const handleLogout = () => {
    clearAuthData();
  };

  const toggleUIState = (key) => {
    setUiState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Router>
      <div className="app-container">
        <NavBar 
          isLoggedIn={auth.isLoggedIn}
          userName={auth.userName}
          userRole={auth.userRole}
          isNavOpen={uiState.isNavOpen}
          isHomesDropdownOpen={uiState.isHomesDropdownOpen}
          onLogout={handleLogout}
          onToggleNav={() => toggleUIState('isNavOpen')}
          onToggleHomesDropdown={() => toggleUIState('isHomesDropdownOpen')}
        />
        
        <div className="content-container">
          <Routes>
            <Route path="/login" element={
              <LoginPage 
                onLogin={handleLogin} 
                isLoggedIn={auth.isLoggedIn} 
              />
            } />
            
            <Route path="/home/:clientId" element={
              <PrivateRoute 
                isLoggedIn={auth.isLoggedIn} 
                userRole={auth.userRole}
              >
                <HomeWrapper />
              </PrivateRoute>
            } />
            
            <Route path="/security-system" element={
              <PrivateRoute 
                isLoggedIn={auth.isLoggedIn} 
                userRole={auth.userRole}
              >
                <SecuritySystem />
              </PrivateRoute>
            } />
            
            {[
              { path: "/manage-users", element: <ManageUsers />, requiredRole: "admin" },
              { path: "/security-settings", element: <SecuritySettings /> },
              { path: "/help-support", element: <HelpSupport /> },
              { path: "/superuser", element: <SuperUser />, requiredRole: "admin" },
              { path: "/system-logs", element: <Systemlog />, requiredRole: "admin" },
              { path: "/Sdata/:siteId", element: <Sdata /> },
            ].map(({ path, element, requiredRole }) => (
              <Route 
                key={path}
                path={path}
                element={
                  <PrivateRoute 
                    isLoggedIn={auth.isLoggedIn} 
                    userRole={auth.userRole}
                    requiredRole={requiredRole}
                  >
                    {element}
                  </PrivateRoute>
                }
              />
            ))}
            
            <Route 
              path="*" 
              element={
                <Navigate to={auth.isLoggedIn ? "/home/1" : "/login"} replace />
              } 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;