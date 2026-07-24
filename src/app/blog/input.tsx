import React from "react"

export default function InputForm() {
  return (
    <form method="POST" action="/blog-submit">
      <input
        type="text"
        name="blog"
        placeholder="Write a blog"
        required
      />

      <button
        type="submit"
        style={{
          backgroundColor: "blue",
          color: "white",
          padding: "10px 20px",
          border: "none",
          cursor: "pointer"
        }}
      >
        Submit
      </button>
    </form>
  )
}