import React, { useState } from "react";
import "./css/crud.css";
import MenuDashboard from "./MenuDashboard";

function Crud() {
  const [menuOpen, setMenuOpen] = useState(true);
  const [boards, setBoards] = useState([]);
  const [boardName, setBoardName] = useState("");

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleCreateBoard = () => {
    const trimmedName = boardName.trim();
    if (trimmedName === "") {
      alert("Please enter a board name.");
      return;
    }

    const newBoard = { id: Date.now(), name: trimmedName };
    setBoards(prev => [...prev, newBoard]);
    setBoardName("");
  };

  const handleEditBoard = id => {
    const board = boards.find(b => b.id === id);
    const newName = prompt("Enter new board name:", board.name);
    if (newName) {
      setBoards(prev =>
        prev.map(b => (b.id === id ? { ...b, name: newName.trim() } : b))
      );
    }
  };

  const handleDeleteBoard = id => {
    if (window.confirm("Are you sure you want to delete this board?")) {
      setBoards(prev => prev.filter(b => b.id !== id));
    }
  };

  return (
    <div className="board-wrapper">
      <MenuDashboard toggleMenu={toggleMenu} menuOpen={menuOpen} />

      <div
        className={`board-content ${menuOpen ? "menu-open" : "menu-closed"}`}
      >
        <div className="container" id="crud-container">
          <h1>Manage Boards</h1>
          <div className="create-board board-creator">
            <input
              type="text"
              id="board-name-input"
              value={boardName}
              onChange={e => setBoardName(e.target.value)}
              placeholder="New board name"
            />
            <button
              id="create-board-btn"
              onClick={handleCreateBoard}
            >
              Create Board
            </button>
          </div>
          <ul id="board-list">
            {boards.map(board => (
              <li key={board.id} className="board-item">
                <span>{board.name}</span>
                <div className="board-actions">
                  <button
                    className="edit"
                     onClick={() => (window.location.href = "/board")}
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDeleteBoard(board.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Crud;
