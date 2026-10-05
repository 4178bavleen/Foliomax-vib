import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_BASE;

function SingleBlog({ setPageTitle }) {
  const { id } = useParams();

  const [blog, setBlog] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/foliomax/blogs/get`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setBlogs(result.data);
          const single = result.data.find(b => b.id === Number(id));
          setBlog(single);
          if (single && setPageTitle) setPageTitle(single.title);
        }
      });

    fetch(`${API_URL}/foliomax/blog-categories/get`)
      .then(res => res.json())
      .then(result => {
        if (result.success) setCategories(result.data);
      });
  }, [id, setPageTitle]);

  if (!blog) return null;

  return (
    <section className="sidebar-page-container blog-details">
      <div className="auto-container">
        <div className="row clearfix">

          {/* ================= LEFT CONTENT ================= */}
          <div className="col-lg-8 col-md-12 col-sm-12 content-side">
            <div className="sb-wrap">

              {/* HEADER CARD */}
              <div className="sb-header-card">
                <h1 className="sb-title">{blog.title}</h1>

                <div className="sb-meta">
                  <span>
                    <i className="flaticon-edit"></i> {blog.authorName}
                  </span>
                  <span>
                    <i className="flaticon-calendar"></i>{" "}
                    {new Date(blog.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <span className="sb-category">
                  {blog.category?.name}
                </span>
              </div>

              {/* HERO IMAGE */}
              <div className="sb-image-card">
                <img
                  src={`${API_URL}${blog.image}`}
                  alt={blog.title}
                />
              </div>

              {/* CONTENT */}
              <div className="sb-content-card">
                <p>{blog.content}</p>
              </div>

              {/* BACK */}
              <div className="sb-back">
                <Link to="/blogs">← Back to Blog</Link>
              </div>

            </div>
          </div>

          {/* ================= RIGHT SIDEBAR (UNCHANGED) ================= */}
          <div className="col-lg-4 col-md-12 col-sm-12 sidebar-side">
            <div className="blog-sidebar default-sidebar">

              <div className="sidebar-widget category-widget">
                <div className="widget-title">
                  <h3>Categories</h3>
                </div>
                <div className="widget-content">
                  <ul className="category-list clearfix">
                    {categories.map(cat => (
                      <li key={cat.id}>
                        <Link to={`/blogs?category=${cat.slug}`}>
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="sidebar-widget post-widget">
                <div className="widget-title">
                  <h3>Popular Post</h3>
                </div>
                <div className="widget-content">
                  {blogs.filter(b => b.id !== blog.id).slice(0, 3).map(item => (
                    <div className="post" key={item.id}>
                      <h5>
                        <Link to={`/detailed-blog/${item.id}`}>
                          {item.title}
                        </Link>
                      </h5>
                      <span className="post-date">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default SingleBlog;
