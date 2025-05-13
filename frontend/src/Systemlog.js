import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Systemlog.css';
import { FaArrowLeft } from 'react-icons/fa';

const Systemlog = () => {
    const navigate = useNavigate();
    const [systemLogs, setSystemLogs] = useState([]);

    useEffect(() => {
        const storedLogs = JSON.parse(localStorage.getItem("systemLogs")) || [];
        setSystemLogs(storedLogs);
    }, []);

    return (
        <div className="systemlog-container">
            <div className="header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <FaArrowLeft /> Back
                </button>
                <h2>System Logs</h2>
            </div>
            {systemLogs.length > 0 ? (
                <ul className="logs-list">
                    {systemLogs.map((log, index) => (
                        <li key={index} className="log-item">
                            <span className="timestamp">{log.timestamp}</span>
                            <span className="message">{log.message}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No system logs available.</p>
            )}
        </div>
    );
};

export default Systemlog;