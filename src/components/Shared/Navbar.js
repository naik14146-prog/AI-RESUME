import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();

    return (
        <nav className="main-nav glass">
            <div className="nav-logo" onClick={() => navigate('/')}>
                <img src={logo + "?v=2"} alt="AI Resume Pro Logo" />
            </div>

            <div className="nav-links">
                <button onClick={() => navigate('/templates')}>Templates</button>
                <button onClick={() => navigate('/dashboard')}>Dashboard</button>
                <button className="cta-btn" onClick={() => navigate('/editor/new')}>Build Now</button>
            </div>
        </nav>
    );
};

export default Navbar;
