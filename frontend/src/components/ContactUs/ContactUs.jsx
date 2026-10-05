import React, { useState, useRef } from "react";

function ContactUs() {
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault(); // stop the page from reloading
    setStatusMessage("");
    setErrorMessage("");

    // basic client-side validation (email/phone presence is handled by HTML required)
    const form = new FormData(e.target);
    const payload = {
      name: form.get("username")?.trim(),
      email: form.get("email")?.trim(),
      phone: form.get("phone")?.trim(),
      city: form.get("city")?.trim() || null,
      topic: form.get("topic")?.trim(),
      message: form.get("message")?.trim(),
    };

    if (!payload.name || !payload.email || !payload.phone || !payload.message) {
      setErrorMessage("Please fill all required fields.");
      return;
    }

    setLoading(true);
    try {
     const res = await fetch(
  `${import.meta.env.VITE_API_BASE}/foliomax/api/contact`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }
);

      const json = await res.json();
      if (!res.ok || !json.ok) {
        const msg = (json && (json.error || json.message)) || "Failed to send message";
        throw new Error(msg);
      }

      setStatusMessage("Message sent successfully!");
      setErrorMessage("");
      // clear form
      if (formRef.current) formRef.current.reset();

      // optional: auto-clear success after 6s
      setTimeout(() => setStatusMessage(""), 6000);
    } catch (err) {
      console.error("Contact submit error:", err);
      setErrorMessage(err.message || "Failed to send message. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        {/* contact-style-two */}
        <section className="contact-style-two">
          <div className="auto-container">
            <div className="title-inner">
              <div className="sec-title">
                <h6>Send Message</h6>
                <h2>Your Success is Our Priority. Let’s Connect.</h2>
                <p>Please do not hesitate to contact us by sending a message.</p>
              </div>
              <div className="special-text">
                <div
                  className="shape"
                  style={{
                    backgroundImage: "url(assets/images/shape/shape-48.png)",
                  }}
                />
                <h6>
                  <img src="assets/images/icons/icon-63.png" alt="" /> Say Hi{" "}
                  &amp; Hello
                </h6>
              </div>
            </div>
            <div className="form-inner">
              <form
                id="contact-form"
                className="default-form"
                onSubmit={handleSubmit}
                ref={formRef}
              >
                <div className="row clearfix">
                  <div className="col-lg-6 col-md-12 col-sm-12 left-column">
                    <div className="form-group">
                      <label htmlFor="username">
                        <i className="fa-regular fa-user" /> Your Name
                      </label>
                      <input
                        id="username"
                        type="text"
                        name="username"
                        placeholder="Enter name here"
                        required
                      />
                    </div>
                    <div className="row clearfix">
                      <div className="col-lg-6 col-md-6 col-sm-12">
                        <div className="form-group">
                          <label htmlFor="email">
                            <i className="fa-regular fa-envelope" /> Email
                            Address
                          </label>
                          <input
                            id="email"
                            type="email"
                            name="email"
                            placeholder="Email address"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-lg-6 col-md-6 col-sm-12">
                        <div className="form-group">
                          <label htmlFor="phone">
                            <i className="fa-solid fa-phone" /> Phone
                          </label>
                          <input
                            id="phone"
                            type="tel"
                            name="phone"
                            required
                            placeholder="Phone number"
                            pattern="[0-9+\-\s]{7,20}"
                            title="Enter a valid phone number"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="city">
                        <i className="fa-regular fa-building" /> City{" "}
                        <span>(optional)</span>
                      </label>
                      <input
                        id="city"
                        type="text"
                        name="city"
                        placeholder="Enter your city"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="topic">
                        <i className="fa-regular fa-comment" /> Want to Discuss
                        About
                      </label>
                      <div className="select-box">
                        <select id="topic" className="selectmenu" name="topic">
                          <option>Withdrawals</option>
                          <option>Currency Pairs</option>
                          <option>Platform &amp; Tools</option>
                          <option>Monitoring &amp; Support</option>
                          <option>Education &amp; Training</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-6 col-md-12 col-sm-12 right-column">
                    <label htmlFor="message">
                      <i className="fa-solid fa-text-height" /> Message
                    </label>
                    <div className="message-box">
                      <div className="form-group">
                        <textarea
                          id="message"
                          name="message"
                          placeholder="Message goes here"
                          required
                          rows={8}
                        />
                      </div>
                      <button
                        className="theme-btn btn-two"
                        type="submit"
                        name="submit-form"
                        disabled={loading}
                        aria-disabled={loading}
                      >
                        <span>{loading ? "Sending..." : "Send Message"}</span>
                      </button>

                      {/* Status messages (accessible) */}
                      <div aria-live="polite" style={{ marginTop: 10 }}>
                        {statusMessage && (
                          <p className="success-message">{statusMessage}</p>
                        )}
                        {errorMessage && (
                          <p className="error-message" style={{ color: "#c00" }}>
                            {errorMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </section>
        {/* contact-style-two end */}

        {/* google-map-section */}
        <section className="google-map-section">
          <div className="map-inner">
            <iframe
              title="Our Location on Google Maps"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3800.629028179656!2d78.46224897508553!3d17.54660658345261!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb8f8d9926618d%3A0xf77e353fcdaba17c!2sDulapally%2C%20Hyderabad%2C%20Telangana%20500100!5e0!3m2!1sen!2sin!4v1700200000000!5m2!1sen!2sin"
              height={535}
              frameBorder={0}
              style={{ border: 0, width: "100%" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="map-content">
            <div className="icon-box">
              <i className="flaticon-map-point" />
            </div>

            <div className="location-box">
              <h5>Dulapally, Hyderabad</h5>
              <p>
                Dulapally, Quthbullapur Mandal <br />
                Hyderabad, Telangana 500100
              </p>
            </div>
          </div>
        </section>
        {/* google-map-section end */}
      </div>
    </>
  );
}

export default ContactUs;
