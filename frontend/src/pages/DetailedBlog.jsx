import React, { useState } from "react";
import PageTitle from "../components/DetailedBlog/DetailedPageTitle";
import SingleBlog from "../components/DetailedBlog/SingleBlog";

export default function DetailedBlog() {
  const [title, setTitle] = useState("Blog Details");

  return (
    <>
      <PageTitle title={title} />
      <SingleBlog setPageTitle={setTitle} />
    </>
  );
}
