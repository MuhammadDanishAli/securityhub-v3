import React, { useState } from 'react';
import './App.css';
import './SecuritySettings.css';

const SecuritySettings = () => {
  const [settings, setSettings] = useState({
    autoArm: false,
    entryDelay: 30,
    exitDelay: 30,
    sirenVolume: 10,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: newValue
    }));
  };

  const handleSave = () => {
    //  save settings (e.g., to an API or localStorage)
    console.log('Saving settings:', settings);
    alert('Settings Saved!');
  };

  return (
    <div className="security-settings-container">
      <h1>Security Settings</h1>
      <div className="settings-group">
        <label>
          Auto Arm:
          <input
            type="checkbox"
            name="autoArm"
            checked={settings.autoArm}
            onChange={handleChange}
          />
        </label>
      </div>
      <div className="settings-group">
        <label>
          Entry Delay (seconds):
          <input
            type="number"
            name="entryDelay"
            value={settings.entryDelay}
            onChange={handleChange}
            min="0"
            max="120"
          />
        </label>
      </div>
      <div className="settings-group">
        <label>
          Exit Delay (seconds):
          <input
            type="number"
            name="exitDelay"
            value={settings.exitDelay}
            onChange={handleChange}
            min="0"
            max="120"
          />
        </label>
      </div>
      <div className="settings-group">
        <label>
          Siren Volume:
          <input
            type="range"
            name="sirenVolume"
            value={settings.sirenVolume}
            onChange={handleChange}
            min="0"
            max="10"
          />
        </label>
        <span>{settings.sirenVolume}</span>
      </div>
      <button onClick={handleSave}>Save Settings</button>
    </div>
  );
};

export default SecuritySettings;