import { useState } from 'react';
import './App.css';

function App() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>ACPN OTA Zone</h1>
        <p>Over The Air Zone Management System</p>
      </header>

      <main className="app-main">
        <section className="welcome-section">
          <h2>Welcome to the ACPN OTA Zone Management System</h2>
          <p>
            This platform helps manage over-the-air updates and zone management.
          </p>
        </section>

        <section className="features-section">
          <h3>Key Features</h3>
          <ul>
            <li>User Management</li>
            <li>Zone Administration</li>
            <li>OTA Updates</li>
            <li>Reports and Analytics</li>
          </ul>
        </section>
      </main>

      <footer className="app-footer">
        <p>© 2025 ACPN OTA Zone - All rights reserved</p>
      </footer>
    </div>
  );
}

export default App;
