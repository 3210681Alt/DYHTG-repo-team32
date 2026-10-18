import './App.css'
import { useState } from 'react'
import titleImg from "./duckfindicon.png" // Icon

class Internship {
  constructor(title, provider, email, phone, desc, address, source, requirements, link, tags) {
    this.title = title
    this.provider = provider
    this.email = email
    this.phone = phone
    this.desc = desc
    this.address = address
    this.source = source
    this.requirements = requirements
    this.link = link
    this.tags = tags
  }
}
const testdata = []
for (let i = 0; i < 10; i++) {
  testdata.push(new Internship("Test Internship", "Matthew Fraser Tech Company", "6767@gmail.com", "+44 12345 678910", "Apply pls", "21 Internship Ln, Glasgow, Scotland", "Internships.com", "A in Higher Maths", "https://www.internships.com/test-internship", ["Summer", "Unpaid"]))
}

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
        <div className="main-page">
          <p>INTERNSHIPS, PERSONALISED FOR YOU</p>
          <h1>Find internships that actually fit you.</h1>
          <p>Tell us about yourself and we'll compare opportunities from multiple sources to find your best matches.</p>

          <button onClick={() => {setPage("Page")}}>Find My Matches →</button>
        </div>
      </main>
    )
  } else if (status === "Page") { // Matthew's code here
    for (let i = 0; i < testdata.length; i++) {
      let tagstxt = ""
      for (let tag = 0; tag < testdata[i].tags.length; tag++) {
        tagstxt += testdata[i].tags[tag] + "  "  
      }
      return(
        <div className="result">
          <h1>{testdata[i].title}</h1>
          <h2>{testdata[i].provider}</h2>
          <p>{tagstxt}</p>
        </div>
      )
    }
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



