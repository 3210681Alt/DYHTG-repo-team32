import './App.css'
import { useState } from 'react'
import titleImg from "./duckfindicon.png"

function NavBar({page, setPage}) {
  return (
    <nav className="navbar">
      <div className="nav-icon">
        <button onClick={() => {setPage("Menu")}}><img src={titleImg} alt="Duckfind🐥" width="125px"/></button>
      </div>
      <div className="nav-buttons">
        <button>Browse Internships</button>
        <button>My Matches</button>
      </div>
    </nav>
  )
}

function WebPages({status, setPage}) {
  if (status === "Menu") {
    return(
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
    )
  } else if (status === "Page") {
    return(
      <main>
        <div>
          <h1>New page!</h1>
        </div>
      </main>
    )
  } else {
    alert("No such page!")
  }
}

function App() {
  const [page, setPage] = useState("Menu")
  return (
    <div>
      <NavBar page={page} setPage={setPage} />
      <WebPages status={page} setPage={setPage} />
    </div>
  )
}

// export default App
export default App



