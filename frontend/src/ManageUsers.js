import React, { useState } from "react";
import { FaUserPlus, FaTrash, FaArrowLeft } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./ManageUser.css"; // Updated to match the renamed file

const Button = ({ children, onClick, className, variant, ...props }) => {
    const baseStyle = "button";
    const variants = {
        destructive: "button-destructive",
        primary: "button-primary",
        default: "button-default",
    };

    return (
        <button
            className={`${baseStyle} ${variants[variant] || variants.default} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </button>
    );
};

const ROLES = ["Admin", "Resident", "Guest"];

const ManageUsers = () => {
    const navigate = useNavigate();

    const [users, setUsers] = useState([
        { id: 1, name: "John Doe", role: "Admin" },
        { id: 2, name: "Jane Smith", role: "Resident" },
    ]);
    const [newUser, setNewUser] = useState("");
    const [newRole, setNewRole] = useState("Resident");
    const [error, setError] = useState("");

    const addUser = () => {
        if (!newUser.trim()) {
            setError("Name cannot be empty.");
            return;
        }

        if (users.some(user => user.name.toLowerCase() === newUser.toLowerCase())) {
            setError("User with this name already exists.");
            return;
        }

        setUsers([...users, { id: Date.now(), name: newUser, role: newRole }]);
        setNewUser("");
        setNewRole("Resident");
        setError("");
    };

    const removeUser = (id) => {
        setUsers(users.filter((user) => user.id !== id));
    };

    const updateUserRole = (id, role) => {
        setUsers(users.map((user) => (user.id === id ? { ...user, role } : user)));
    };

    return (
        <div className="container">
            <div className="header">
                <Button variant="default" onClick={() => navigate(-1)} className="back-button">
                    <FaArrowLeft /> Back
                </Button>
                <h2>Manage Users</h2>
            </div>

            <ul className="user-list">
                <AnimatePresence>
                    {users.map((user) => (
                        <motion.li
                            key={user.id}
                            className="user-item"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <span>{user.name} ({user.role})</span>
                            <div className="user-actions">
                                <select
                                    className="role-select"
                                    value={user.role}
                                    onChange={(e) => updateUserRole(user.id, e.target.value)}
                                    aria-label={`Change role for ${user.name}`}
                                >
                                    {ROLES.map((role) => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                                <Button
                                    variant="destructive"
                                    onClick={() => removeUser(user.id)}
                                    aria-label={`Remove ${user.name}`}
                                >
                                    <FaTrash />
                                </Button>
                            </div>
                        </motion.li>
                    ))}
                </AnimatePresence>
            </ul>

            <div className="add-user">
                <input
                    type="text"
                    className="input-field"
                    placeholder="Enter name"
                    value={newUser}
                    onChange={(e) => {
                        setNewUser(e.target.value);
                        setError("");
                    }}
                    aria-label="Enter new user name"
                />
                <select
                    className="role-select"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    aria-label="Select role"
                >
                    {ROLES.map((role) => (
                        <option key={role} value={role}>{role}</option>
                    ))}
                </select>
                <Button onClick={addUser} variant="primary">
                    <FaUserPlus />
                </Button>
            </div>

            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

export default ManageUsers;