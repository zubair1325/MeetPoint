import React from "react";
import { Link } from "react-router-dom";

import "../App.css";
function LandingPage() {
  return (
    <div className="landingPageContainer">
      <nav>
        <div className="nav-header">
          <h2>
            <i className="fa-solid fa-video"></i> MeetPoint
          </h2>
        </div>
        <div className="nav-list">
          <p>Join as Guest</p>
          <p>Register</p>
          <div role="button">
            <p>Login</p>
          </div>
        </div>
      </nav>
      <div className="landing-main-container">
        <div className="landing-main-container-text-content">
          <h3>
            <span>Secure</span> Video Conferencing
          </h3>
          <h3>For Everyone</h3>
          <p>
            Connect, collaborate, and celebrate
            <br />
            from anywhere with <span>MeetPoint</span>
          </p>
          <div role="button">
            <Link to="/auth">Get Started</Link>
          </div>
        </div>
        <div className="landing-main-container-img-content">
          <img src="/mobile.png" alt="mobile photo" />
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
