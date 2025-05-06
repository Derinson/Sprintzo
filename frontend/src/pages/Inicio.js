import React from "react";

function Inicio() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome to the Public Page!</h1>
      <p>This is a page accessible to everyone. Feel free to explore!</p>
      <a href="/login" style={{ textDecoration: "none", color: "blue" }}>
        Go to Login
      </a>
    </div>
  );
}

export default Inicio;
