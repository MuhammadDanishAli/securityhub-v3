import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import OIP from './OIP.jpg';

const API_URL = process.env.REACT_APP_API_URL || "https://Danish1122.pythonanywhere.com/api/";

const LoginPage = ({ onLogin, isLoggedIn }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/home/1');
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}login/`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 401) {
          throw new Error('Invalid username or password.');
        }
        throw new Error(data.error || 'Login failed. Please try again.');
      }

      const data = await response.json();
      const { token, user_id, username: responseUsername, role, is_superuser } = data;

      if (!token || !user_id) {
        throw new Error('Invalid response from server: missing token or user ID');
      }

      onLogin(token, responseUsername, role || 'user', is_superuser || false);

      if (is_superuser || role === 'admin') {
        navigate('/manage-users'); // Redirect to an existing admin route
      } else {
        navigate('/home/1');
      }
    } catch (err) {
      setError(err.message);
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
        {error && <p className="error-message" id="login-error">{error}</p>}
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
              autoComplete="username"
              aria-describedby={error ? "login-error" : undefined}
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
              autoComplete="current-password"
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>
          <button type="submit" className="login-btn">Login</button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
