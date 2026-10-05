import React from "react";
import { Link } from "react-router-dom";

function DetailedPageTitle({ title = "Blogs" }) {
  return (
    <section className="page-title">
      <div
        className="bg-layer"
        style={{
          backgroundImage: "url(/assets/images/background/page-title.jpg)",
        }}
      />
      <div className="auto-container">
        <div className="content-box">
          <h1>{title}</h1>
          <ul className="bread-crumb clearfix">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <span>{title}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default DetailedPageTitle;
