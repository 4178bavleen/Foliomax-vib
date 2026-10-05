import React, { useState, useEffect } from "react";

function Faq() {
  const [tabs, setTabs] = useState([]);
  const [data, setData] = useState({});
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [openByTab, setOpenByTab] = useState({});

  // Fetch API
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await fetch(
  `${import.meta.env.VITE_API_BASE}/foliomax/public/faq-categories`
);
        const json = await res.json();

        const categories = json?.data || [];

        // map tabs
        const mappedTabs = categories.map((cat, index) => ({
          id: `tab-${cat.id}`,
          label: cat.name,
        }));

        // map faq data
        const mappedData = {};
        const openState = {};

        categories.forEach((cat) => {
          const tabId = `tab-${cat.id}`;

          mappedData[tabId] = (cat.faqs || []).map((faq) => ({
            q: faq.question,
            a: faq.answer,
          }));

          openState[tabId] = 0; // first open
        });

        setTabs(mappedTabs);
        setData(mappedData);
        setOpenByTab(openState);
      } catch (err) {
        console.error("FAQ API Error:", err);
      }
    };

    fetchFaqs();
  }, []);

  const activeTabId = tabs[activeTabIndex]?.id;
  const activeList = data[activeTabId] || [];
  const openIndex = openByTab[activeTabId];

  const toggleAccordion = (idx) => {
    setOpenByTab((prev) => ({
      ...prev,
      [activeTabId]: prev[activeTabId] === idx ? null : idx,
    }));
  };

  const handleKeyToggle = (e, idx) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleAccordion(idx);
    }
  };

  return (
    <>
      <section className="faq-section faq-page-section sec-pad">
        <div className="auto-container">
          <div className="tabs-box">
            <div className="row clearfix">

              {/* Sidebar Tabs */}
              <div className="col-lg-3 col-md-12 col-sm-12 sidebar-column">
                <div className="tab-btn-box">
                  <ul className="tab-btns tab-buttons">
                    {tabs.map((t, i) => (
                      <li
                        key={t.id}
                        className={`tab-btn ${
                          i === activeTabIndex ? "active-btn" : ""
                        }`}
                        onClick={() => setActiveTabIndex(i)}
                      >
                        {t.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Content */}
              <div className="col-lg-9 col-md-12 col-sm-12 content-column">
                <div className="tabs-content content-box">
                  {tabs.map((t, i) => {
                    const isActive = i === activeTabIndex;
                    const list = data[t.id] || [];
                    const open = openByTab[t.id];

                    return (
                      <div
                        key={t.id}
                        className={`tab ${isActive ? "active-tab" : ""}`}
                        style={{ display: isActive ? "block" : "none" }}
                      >
                        <ul className="accordion-box">
                          {list.map((item, idx) => {
                            const isOpen = open === idx;
                            return (
                              <li
                                key={idx}
                                className={`accordion block ${
                                  isOpen ? "active-block" : ""
                                }`}
                              >
                                <div
                                  className={`acc-btn ${
                                    isOpen ? "active" : ""
                                  }`}
                                  onClick={() => toggleAccordion(idx)}
                                >
                                  <h5>{item.q}</h5>
                                </div>
                                <div
                                  className={`acc-content ${
                                    isOpen ? "current" : ""
                                  }`}
                                  style={{
                                    display: isOpen ? "block" : "none",
                                  }}
                                >
                                  <div className="text">
                                    <p>{item.a}</p>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* /Content */}

            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Faq;