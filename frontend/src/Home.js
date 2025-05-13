import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Home.css';
import OIP from './OIP.jpg';
import Logo1 from './Logo1.jpeg';

// Clients and their respective home details
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

function Home({ clientId: propClientId, userRole }) {
    const navigate = useNavigate();
    const { clientId: paramClientId } = useParams();
    const clientId = propClientId || paramClientId;
    const currentTime = new Date().toLocaleTimeString();

    const [armedHomes, setArmedHomes] = useState([]);
    const [stayMode, setStayMode] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isValidClient, setIsValidClient] = useState(true);
    const [client, setClient] = useState(null);

    useEffect(() => {
        const parsedClientId = parseInt(clientId);
        if (isNaN(parsedClientId)) {
            setIsValidClient(false);
            return;
        }

        const foundClient = clients.find(client => client.id === parsedClientId);
        if (!foundClient) {
            setIsValidClient(false);
            return;
        }

        setClient(foundClient);
        setIsValidClient(true);
    }, [clientId]);

    useEffect(() => {
        if (!client) return;

        const storedArmedHomes = localStorage.getItem(`armedHomes-${clientId}`);
        const storedStayMode = localStorage.getItem(`stayMode-${clientId}`);

        const initialArmedHomes = storedArmedHomes ? JSON.parse(storedArmedHomes) : client.homes.map(() => Math.random() < 0.5);
        const initialStayMode = storedStayMode ? JSON.parse(storedStayMode) : client.homes.map(() => Math.random() < 0.5);

        setArmedHomes(initialArmedHomes);
        setStayMode(initialStayMode);
    }, [clientId, client]);

    useEffect(() => {
        if (client) {
            localStorage.setItem(`armedHomes-${clientId}`, JSON.stringify(armedHomes));
            localStorage.setItem(`stayMode-${clientId}`, JSON.stringify(stayMode));
        }
    }, [armedHomes, stayMode, clientId, client]);

    const addToSystemLogs = (message) => {
        const timestamp = new Date().toLocaleString();
        const newLog = { timestamp, message };
        const storedLogs = JSON.parse(localStorage.getItem("systemLogs")) || [];
        storedLogs.unshift(newLog);
        localStorage.setItem("systemLogs", JSON.stringify(storedLogs));
    };

    const toggleHomeArmStatus = (index) => {
        const newArmedHomes = [...armedHomes];
        newArmedHomes[index] = !newArmedHomes[index];
        setArmedHomes(newArmedHomes);
        const message = `HOME NO ${index + 1} at ${client.homes[index].address} is now ${newArmedHomes[index] ? "Armed" : "Disarmed"}`;
        addNotification(message);
        addToSystemLogs(message);
    };

    const toggleStayMode = (index) => {
        const newStayMode = [...stayMode];
        newStayMode[index] = !newStayMode[index];
        setStayMode(newStayMode);
        const modeText = newStayMode[index] ? "Stay Mode" : "Away Mode";
        const message = `HOME NO ${index + 1} at ${client.homes[index].address} is now in ${modeText}`;
        addNotification(message);
        addToSystemLogs(message);
    };

    const addNotification = (message) => {
        setNotifications(prev => [...prev, message]);
        setTimeout(() => {
            setNotifications(prev => prev.slice(1));
        }, 5000);
    };

    if (!isValidClient) {
        return (
            <div className="home-container">
                <p>Invalid Client ID. Please check the URL.</p>
            </div>
        );
    }

    if (!client) {
        return <div className="home-container">Loading...</div>;
    }

    return (
        <div className="home-container">
            <div className="header-section">
                <div className="header-left">
                    <h1>Welcome, {client.name}</h1>
                    <p>Time: {currentTime}</p>
                </div>
                <div className="header-right">
                    <img src={OIP} alt="OIP Logo" className="oip-logo" />
                    <img src={Logo1} alt="Company Logo" className="company-logo" />
                </div>
            </div>

            <div className="dashboard-container">
                {client.homes.map((home, index) => (
                    <div key={home.siteId} className="home-card">
                        <div className="home-header">
                            <img
                                src={Logo1}
                                alt={`Home ${index + 1} Logo`}
                                className="logo-img"
                            />
                            <div className="home-details">
                                <p className="logo-label">HOME NO {index + 1}</p>
                                <p className="Owner">Owner: {client.name}</p>
                                <p className="site">Site Id: {home.siteId}</p>
                                <p className="SiteType">Site type: {home.siteType}</p>
                                <p className="address-text">{home.address}</p>
                                <p className="status-text">
                                    Status:
                                    <span className={`status-indicator ${armedHomes[index] ? "status-armed" : "status-disarmed"}`}>
                                        {armedHomes[index] ? "Armed" : "Disarmed"}
                                    </span>
                                </p>
                                <p className="stay-status">
                                    Mode:
                                    <span className={`status-indicator ${stayMode[index] ? "status-stay" : "status-away"}`}>
                                        {stayMode[index] ? "Stay" : "Away"}
                                    </span>
                                </p>
                                <p className="zones-label">Normal Zones: {home.zones.normal.join(", ")}</p>
                                <p className="alert-zones-label">Alert Zones: {home.zones.alert.join(", ")}</p>
                            </div>
                        </div>
                        <div className="home-actions">
                            <button className="toggle-btn" onClick={() => toggleHomeArmStatus(index)}>
                                {armedHomes[index] ? "Disarm" : "Arm"}
                            </button>
                            <button className="mode-btn" onClick={() => toggleStayMode(index)}>
                                {stayMode[index] ? "Away" : "Stay"}
                            </button>
                            <button className="view-btn" onClick={() => navigate(`/security-system/${home.siteId}`)}>
                                Security
                            </button>
                            <button className="view-btn" onClick={() => navigate(`/site-data/${home.siteId}`)}>
                                Site Data
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {notifications.length > 0 && (
                <div className="notification-banner">
                    {notifications.map((notification, index) => (
                        <p key={index} className="notification-text">{notification}</p>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Home;