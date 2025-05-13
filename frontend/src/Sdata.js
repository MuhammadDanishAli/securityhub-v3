import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';
import './Sdata.css';

// Mock data generation (replace with actual data fetching)
const generateSensorData = (sensorType, address) => {
    const data = [];
    const now = new Date();
    for (let i = 0; i < 20; i++) {
        const time = new Date(now.getTime() - i * 60000); // 1-minute intervals
        let value = 0;
        if (sensorType === 'temperature') {
            value = 20 + Math.random() * 10; // Temperature between 20 and 30
        } else if (sensorType === 'humidity') {
            value = 50 + Math.random() * 30; // Humidity between 50 and 80
        } else if (sensorType === 'vibration') {
            value = Math.random() < 0.2 ? 1 : 0; // Simulate vibration (0 or 1)
        } else if (sensorType === 'pir') {
            value = Math.random() < 0.3 ? 1 : 0;
        }
        data.push({
            time: time.toLocaleTimeString(),
            [sensorType]: value,
        });
    }
    return {
        siteAddress: address,
        sensorType,
        data,
    };
};

const Sdata = () => {
    const { siteId } = useParams();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const address = searchParams.get('address') || 'Unknown Address';

    const [temperatureData, setTemperatureData] = useState(generateSensorData('temperature', address));
    const [humidityData, setHumidityData] = useState(generateSensorData('humidity', address));
    const [vibrationData, setVibrationData] = useState(generateSensorData('vibration', address));
    const [pirData, setPirData] = useState(generateSensorData('pir', address));

    useEffect(() => {
        const interval = setInterval(() => {
            setTemperatureData(generateSensorData('temperature', address));
            setHumidityData(generateSensorData('humidity', address));
            setVibrationData(generateSensorData('vibration', address));
            setPirData(generateSensorData('pir', address));
        }, 5000);

        return () => clearInterval(interval);
    }, [address]);

    // Find the client and home based on siteId
    const getSiteInfo = (siteId) => {
        for (const client of [
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
        ]) {
            const home = client.homes.find(h => h.siteId === parseInt(siteId));
            if (home) {
                return { clientName: client.name, home };
            }
        }
        return { clientName: 'Unknown', home: null };
    };

    const { clientName, home } = getSiteInfo(siteId);

    if (!home) {
        return (
            <div className="sdata-container">
                <h1>Site Data</h1>
                <p>Site with ID {siteId} not found.</p>
            </div>
        );
    }

    return (
        <div className="sdata-container">
            <h1>Site Data</h1>
            <div className="site-info">
                <p>Client Name: {clientName}</p>
                <p>Site Type: {home.siteType}</p>
                <p>Address: {home.address}</p>
                <p>Site ID: {siteId}</p>
            </div>

            <div className="chart-container">
                <h2>Temperature Data</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={temperatureData.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="temperature" stroke="#ff7300" activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="chart-container">
                <h2>Humidity Data</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={humidityData.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="humidity" stroke="#82ca9d" activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="chart-container">
                <h2>Vibration Data</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={vibrationData.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis tickCount={2} domain={[0, 1.5]} />
                        <Tooltip formatter={(value) => value === 1 ? 'Vibration Detected' : 'No Vibration'} />
                        <Legend />
                        <Line type="step" dataKey="vibration" stroke="#e55353" activeDot={{ r: 8 }}
                              formatter={(value) => value === 1 ? 'Vibration' : 'No Vibration'} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="chart-container">
                <h2>PIR Sensor Data</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={pirData.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis tickCount={2} domain={[0, 1.5]} />
                        <Tooltip formatter={(value) => value === 1 ? 'Motion Detected' : 'No Motion'}/>
                        <Legend />
                        <Line
                            type="step"
                            dataKey="pir"
                            stroke="#8884d8"
                            activeDot={{ r: 8 }}
                            formatter={(value) => value === 1 ? 'Motion' : 'No Motion'}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Sdata;