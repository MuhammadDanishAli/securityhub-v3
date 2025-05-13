import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SuperUser.css';
import OIP from './OIP.jpg';

const SuperUser = () => {
  const navigate = useNavigate();

  return (
    <div className="superuser-container">
      <div className="main-heading">
        <h2>Security System</h2>
        <div className="img">
          <img src={OIP} alt="Logo" className="logo" />
        </div>
      </div>
      <header className="superuser-header">
        <h2>Welcome Super User</h2>
      </header>

      <div className="navigation-section">
        <button
          onClick={() => navigate('/manage-users')}
          className="manage-users-button"
        >
          Manage Users
        </button>
      </div>
    </div>
  );
};

export default SuperUser;