import './App.css'
import { useState } from 'react'

function App() {
  const [page, setPage] = useState("Menu")

  if (page === "Page") {
    return(
      <div>
        <h1>New page!</h1>
      </div>
    )
  }

  return (
    <div>
      <nav className="navbar">
        <h2>Duckfind🐥</h2>

        <div className="nav-buttons">
          <button>Browse Internships</button>
          <button>My Matches</button>
        </div>
      </nav>

      <main>
        <p>INTERNSHIPS, PERSONALISED FOR YOU</p>

        <h1>
          Find internships that actually fit you.
        </h1>

        <p>
          Tell us about yourself and we'll compare opportunities
          from multiple sources to find your best matches.
        </p>

        <button onClick={() => {setPage("Page")}}>Find My Matches →</button>
      </main>
    </div>
  )
}

// export default App
export default App



