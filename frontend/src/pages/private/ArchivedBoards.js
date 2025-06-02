import React, { useEffect, useState } from 'react';
import MenuDashboard from './MenuDashboard';
import './css/archivedBoards.css';

function ArchivedBoards() {
  const [menuOpen, setMenuOpen] = useState(true);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  useEffect(() => {
    const fetchArchivedBoards = async () => {
      try {
        const response = await fetch("http://localhost:5000/tablerosRoutes/with-archived", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) throw new Error('Error fetching boards');

        const data = await response.json();
        setBoards(data.boards || []);
        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        setLoading(false);
      }
    };

    fetchArchivedBoards();
  }, []);

  return (
    <div className="archived-boards-wrapper">
      <MenuDashboard
        handleLogout={handleLogout}
        toggleMenu={toggleMenu}
        menuOpen={menuOpen}
      />

      <div className={`archived-boards-content ${menuOpen ? 'menu-open' : 'menu-closed'}`}>
        <h1>📦 Boards with Archived Cards</h1>
        
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : boards.length === 0 ? (
          <div className="no-archived">
            <i className="bx bx-archive"></i>
            <p>No boards with archived cards</p>
          </div>
        ) : (
          <div className="boards-grid">
            {boards.map(board => (
              <div key={board._id} className="board-card" onClick={() => window.location.href = `/board/${board._id}`}>
                <div className="board-header">
                  <h3>{board.name}</h3>
                  <span className="archived-count">{board.archivedCount} archived</span>
                </div>
                <div className="board-info">
                  <p>{board.description}</p>
                  <div className="last-archived">
                    Last archived: {new Date(board.lastArchivedDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ArchivedBoards; 