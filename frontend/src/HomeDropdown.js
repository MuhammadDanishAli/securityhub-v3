import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaCaretDown } from 'react-icons/fa';
import './HomeDropdown.css';

const clients = [
    { id: 1, name: 'Ali' },
    { id: 2, name: 'Ahmed' },
    { id: 3, name: 'Sara' },
];

const HomeDropdown = ({ isHomesDropdownOpen, onToggleHomesDropdown, onToggleNav, isMobile }) => {
    if (isMobile) {
        return (
            <>
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
            </>
        );
    }

    return (
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
            </div>
        </div>
    );
};

export default HomeDropdown;