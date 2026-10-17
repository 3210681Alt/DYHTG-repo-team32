import './App.css'
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
import { useState } from 'react'

function App() {
  const [page, setPage] = useState("Menu")

  if (page === "Page") {
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



