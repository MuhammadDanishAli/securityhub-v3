import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import OIP from './OIP.jpg';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const LoginPage = ({ onLogin, isLoggedIn }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/home/1');
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic form validation
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      // Call onLogin with token, username, role, and is_superuser
      onLogin(data.token, data.username, data.role, data.is_superuser);
      // Navigate based on role
      if (data.is_superuser || data.role === 'admin') {
        navigate('/superuser');
      } else {
        navigate('/home/1');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login. Please try again.');
      console.error('Login error:', err);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-header">
        <img src={OIP} alt="Security System Logo" className="login-logo" />
        <h1>Security System</h1>
      </div>
      <div className="login-card">
        <h2>Sign In</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-describedby={error ? "username-error" : undefined}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby={error ? "password-error" : undefined}
            />
          </div>
          <button type="submit" className="login-btn">Login</button>
        </form>
        <p className="forgot-password">
          <a href="#forgot">Forgot Password?</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;