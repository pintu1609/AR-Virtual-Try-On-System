
// src/App.js
import { useState } from "react";
import "./App.css";
import ARTryOn from "./components/ARTryOn";
import AdminUpload from "./components/AdminUpload";

function App() {
  const [tryMode, setTryMode] = useState(false);

  return (
    <div className="app-root">
      <header className="header">AR T-Shirt Try-On (WebAR, MERN)</header>

      <div className="main-layout">
        <main className="main-panel">
          {!tryMode ? (
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <button
                onClick={() => setTryMode(true)}
                style={{
                  padding: "14px 30px",
                  fontSize: "18px",
                  borderRadius: "10px",
                  background: "#00d4ff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                👕 Start T-Shirt Try-On
              </button>
            </div>
          ) : (
            <ARTryOn />
          )}
        </main>

        <aside className="admin-panel">
          {/* <h2>Admin / Upload</h2> */}
          <AdminUpload />
        </aside>
      </div>
    </div>
  );
}

export default App;
