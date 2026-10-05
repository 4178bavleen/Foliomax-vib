import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_BASE;

function BlogGrid() {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/foliomax/blogs/get`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setBlogs(result.data);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <section className="news-section blog-grid-one">
      <div className="auto-container">
        <div className="row clearfix">
          {blogs.map((blog, index) => (
            <div
              className="col-lg-4 col-md-6 col-sm-12 news-block"
              key={blog.id}
            >
              <div
                className="news-block-one wow fadeInUp animated"
                data-wow-delay={`${index * 300}ms`}
                data-wow-duration="1500ms"
              >
                <div className="inner-box">
                  <figure className="image-box">
                    <Link to={`/detailed-blog/${blog.id}`}>
                      <img
                        src={`${API_URL}${blog.image}`}
                        alt={blog.title}
                      />
                    </Link>
                  </figure>

                  <div className="lower-content">
                    <h3>
                      <Link to={`/detailed-blog/${blog.id}`}>
                        {blog.title}
                      </Link>
                    </h3>

                    <ul className="post-info">
                      <li>
                        <i className="flaticon-edit" />
                        <Link to={`/detailed-blog/${blog.id}`}>
                          {blog.authorName}
                        </Link>
                      </li>
                      <li>
                        <i className="flaticon-calendar" />
                        {new Date(blog.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        })}
                      </li>
                    </ul>

                    <div className="lower-box">
                      <h6>{blog.category?.name}</h6>
                      <Link to={`/detailed-blog/${blog.id}`}>
                        <i className="flaticon-right-arrow" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination UI unchanged */}
        <div className="pagination-wrapper centred">
          <ul className="pagination clearfix">
            <li><a href="#"><i className="flaticon-left" /></a></li>
            <li><a href="#" className="current">01</a></li>
            <li><a href="#">02</a></li>
            <li><a href="#">03</a></li>
            <li><a href="#"><i className="flaticon-right-arrow-1" /></a></li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default BlogGrid;
