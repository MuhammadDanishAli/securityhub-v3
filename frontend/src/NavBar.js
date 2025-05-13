import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaUserCircle, FaSignOutAlt, FaUsers, FaCog, FaFolder, FaQuestionCircle, FaSun, FaMoon, FaPalette } from 'react-icons/fa';
import './NavBar.css';

const NavBar = ({ isLoggedIn, userName, userRole, onLogout, theme, toggleTheme }) => {
  const getThemeIcon = () => {
    switch (theme) {
      case 'dark':
        return <FaMoon />;
      case 'brown':
        return <FaPalette />;
      default:
        return <FaSun />;
    }
  };

  return (
    <nav className="navbar">
      <ul className="navbar__menu">
        {isLoggedIn ? (
          <>
            <li className="navbar__item">
              <Link to="/home/1" className="navbar__link">
                <FaHome />
                <span>Home</span>
              </Link>
            </li>
            <li className="navbar__item">
              <Link to="/security-system/1" className="navbar__link">
                <FaCog />
                <span>Security</span>
              </Link>
            </li>
            {userRole === 'admin' && (
              <>
                <li className="navbar__item">
                  <Link to="/manage-users" className="navbar__link">
                    <FaUsers />
                    <span>Users</span>
                  </Link>
                </li>
                <li className="navbar__item">
                  <Link to="/system-logs" className="navbar__link">
                    <FaFolder />
                    <span>Logs</span>
                  </Link>
                </li>
              </>
            )}
            <li className="navbar__item">
              <Link to="/help-support" className="navbar__link">
                <FaQuestionCircle />
                <span>Help</span>
              </Link>
            </li>
            <li className="navbar__item">
              <button className="navbar__link" onClick={toggleTheme}>
                {getThemeIcon()}
                <span>{theme.charAt(0).toUpperCase() + theme.slice(1)} Theme</span>
              </button>
            </li>
            <li className="navbar__item">
              <button className="navbar__link logout-btn" onClick={onLogout}>
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </li>
          </>
        ) : (
          <li className="navbar__item">
            <Link to="/login" className="navbar__link">
              <FaUserCircle />
              <span>Login</span>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default NavBar;