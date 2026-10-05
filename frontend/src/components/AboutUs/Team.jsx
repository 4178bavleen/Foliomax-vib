import React, { useState } from "react";
import "./Team.css";

function Team() {
  const [activeMember, setActiveMember] = useState(null);

  const teamData = [
    {
      name: "Mrs. Priyanka",
      role: "Creative Vision Architect",
      image: "assets/images/team/priyanka.jpeg",
      short: "Driving mind behind Foliomax’s voice and vision.",
      full: `Priyanka Singh is the driving mind behind Foliomax’s 
voice and vision. With a commerce background and 
a passion for transforming ideas into experiences, 
she shaped Foliomax from concept to identity—
defining its tone, design language, and educational 
philosophy. Every story, interface, and learning path 
reflects her belief that finance should be 
understood not just through numbers, but through 
clarity, creativity, and connection.`,
    },
    {
      name: "Dr. Tripti Singh",
      role: "Research & Insight Catalyst",
      image: "assets/images/team/tripti.jpeg",
      short: "Bridging science and finance with clarity.",
      full: `From the research halls of Washington 
University School of Medicine, St. Louis, to 
Hyderabad’s vibrant scientific ecosystem, 
Dr. Tripti Singh brings analytical precision and 
curiosity to every idea. At Foliomax, she bridges 
the worlds of science and finance—turning 
evidence-based reasoning into structured 
learning models that help users think critically, 
learn deeply, and make informed decisions.
`,
    },
    {
      name: "Mr. Vikas Chandra",
      role: "Strategic Growth & Experience Curator",
      image: "assets/images/team/vikas.jpeg",
      short: "Turning vision into real-world impact.",
      full: `An MBA and founder of Maxpro Business Solution (maxpro.co.in), 
Vikas Singh combines strategic foresight with an entrepreneurial 
edge. At Foliomax, he guides long-term direction, ensuring that 
every vision evolves into real-world impact. His approach blends 
structure with creativity—building pathways that make financial 
learning purposeful, practical, and rewarding for a growing 
community.`,
    },
  ];

  return (
    <>
      <section className="team-section">
        <div className="auto-container">
          <div className="sec-title">
            <h6>Team Members</h6>
            <h2>Our Team, Your Financial Success.</h2>
          </div>

          <div className="row clearfix">
            {teamData.map((member, index) => (
              <div
                key={index}
                className="col-lg-4 col-md-6 col-sm-12 team-block"
              >
                <div className="team-block-one">
                  <div className="inner-box">
                    <figure
                      className="image-box clickable"
                      onClick={() => setActiveMember(member)}
                    >
                      <img src={member.image} alt={member.name} />
                    </figure>

                   <div className="lower-content">
  <h3>{member.name}</h3>
  <p>{member.short}</p>

  <div className="lower-box">
    <span className="designation">{member.role}</span>
  </div>

  {/* NEW BUTTON */}
 <div className="info-btn-box">
  <button
    className="premium-btn"
    onClick={() => setActiveMember(member)}
  >
    <span className="icon">ℹ</span>
    <span>Know More</span>
  </button>
</div>
</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= POPUP MODAL ================= */}
      {activeMember && (
        <div className="team-modal-overlay" onClick={() => setActiveMember(null)}>
          <div
            className="team-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setActiveMember(null)}
            >
              ×
            </button>

            <img
              src={activeMember.image}
              alt={activeMember.name}
              className="modal-image"
            />

            <h3>{activeMember.name}</h3>
            <span className="modal-role">{activeMember.role}</span>
            <p className="modal-description">{activeMember.full}</p>
          </div>
        </div>
      )}
    </>
  );
}

export default Team;
