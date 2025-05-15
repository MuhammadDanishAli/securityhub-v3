import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useParams } from 'react-router-dom';
import NavBar from './NavBar';
import './App.css';
import Home from './Home';
import LoginPage from './LoginPage';
import ManageUsers from './ManageUsers';
import SecuritySettings from './SecuritySettings';
import HelpSupport from './HelpSupport';
import Systemlog from './Systemlog';
import Sdata from './Sdata';
import SecuritySystem from './SecuritySystem';

// Home Wrapper Component to use useParams
const HomeWrapper = ({ userRole, token, apiUrl }) => {
  const { clientId } = useParams();
  return <Home clientId={clientId} userRole={userRole} token={token} apiUrl={apiUrl} />;
};

const SecuritySystemWrapper = ({ token, apiUrl }) => {
  const { clientId } = useParams();
  return <SecuritySystem clientId={clientId} token={token} apiUrl={apiUrl} />;
};

const SdataWrapper = ({ token, apiUrl }) => {
  const { clientId } = useParams();
  return <Sdata clientId={clientId} token={token} apiUrl={apiUrl} />;
};

// Constants
const API_URL = process.env.REACT_APP_API_URL || "https://Danish1122.pythonanywhere.com/api/";

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

// Main App Component
function App() {
  const [auth, setAuth] = useState({
    isLoggedIn: false,
    userRole: null,
    userName: '',
    token: '',
  });
  const [theme, setTheme] = useState('light');
  const [isNavOpen, setIsNavOpen] = useState(false);

curl -X GET https://Danish1122.pythonanywhere.com/api/sensor-status/ \
-H "Authorization: Token 125d04c20816f2f5a4e7721bd83d6b000322fb35" \
-H "Origin: https://securityhub-v3.vercel.app"
  const clearAuthData = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('token');
    setAuth({ isLoggedIn: false, userRole: null, userName: '', token: '' });
  };

  const handleLogin = (token, username, role, is_superuser) => {
    const userRole = role === 'admin' || is_superuser ? 'admin' : 'user';
    const userData = {
      isLoggedIn: true,
      userRole: userRole,
      userName: username,
      token: token,
    };
    
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', userRole);
    localStorage.setItem('userName', username);
    localStorage.setItem('token', token);
    
    setAuth(userData);
    console.log("Logged in with role:", userRole, "is_superuser:", is_superuser);
  };

  const handleLogout = () => {
    clearAuthData();
  };

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : prevTheme === 'dark' ? 'brown' : 'light'));
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <Router>
      <div className="app-container" data-theme={theme}>
        <NavBar 
          isLoggedIn={auth.isLoggedIn}
          userName={auth.userName}
          userRole={auth.userRole}
          isNavOpen={isNavOpen}
          onLogout={handleLogout}
          onToggleNav={toggleNav}
          theme={theme}
          toggleTheme={toggleTheme}
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
                <HomeWrapper userRole={auth.userRole} token={auth.token} apiUrl={API_URL} />
              </PrivateRoute>
            } />
            
            <Route path="/security-system/:clientId" element={
              <PrivateRoute 
                isLoggedIn={auth.isLoggedIn} 
                userRole={auth.userRole}
              >
                <SecuritySystemWrapper token={auth.token} apiUrl={API_URL} />
              </PrivateRoute>
            } />
            
            {[
              { path: "/manage-users", element: <ManageUsers />, requiredRole: "admin" },
              { path: "/security-settings", element: <SecuritySettings /> },
              { path: "/help-support", element: <HelpSupport /> },
              { path: "/system-logs", element: <Systemlog />, requiredRole: "admin" },
              { path: "/site-data/:clientId", element: <SdataWrapper token={auth.token} apiUrl={API_URL} /> },
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
}

export default App;
