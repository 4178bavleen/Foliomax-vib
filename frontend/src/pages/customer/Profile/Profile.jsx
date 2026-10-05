import React, { useState, useEffect } from "react";
import { updateProfile, getProfile, uploadProfileImage } from "../../../api/profileApi";
import { toast } from "react-toastify";
import "./Profile.css";

const BASE_URL = import.meta.env.VITE_API_BASE;

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [profileImg, setProfileImg] = useState(null);
  const [preview, setPreview] = useState("");
  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  // 📌 Load profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await getProfile();

        if (res.ok && res.user) {
          // Convert DB path to full URL for display
          const imgURL = res.user.profileImage 
            ? `${BASE_URL}${res.user.profileImage}` 
            : "/assets/images/default-avatar.png";

          setUser({
            name: res.user.name || "",
            email: res.user.email || "",
            phone: res.user.phone || "",
            password: "",
          });

          setPreview(imgURL);
        } else {
          toast.error(res.error || "Unable to load profile");
        }
      } catch (err) {
        console.error("GET PROFILE ERROR:", err);
        toast.error("Server error loading profile");
      }
    }

    loadProfile();
  }, []);

  // image change preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProfileImg(file);
    setPreview(URL.createObjectURL(file)); // instant preview
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (profileImg) {
        const imgRes = await uploadProfileImage(profileImg);
        if (!imgRes.ok) {
          toast.error(imgRes.error || "Image upload failed");
          setLoading(false);
          return;
        }

        // refresh preview with new image URL
        setPreview(`${BASE_URL}${imgRes.url}`);
      }

      const res = await updateProfile(user);

      res.ok
        ? toast.success("Profile updated successfully ✔")
        : toast.error(res.error || "Update failed");
    } catch (err) {
      console.error("UPDATE ERROR:", err);
      toast.error("Server error while updating profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <h2 className="profile-title">My Profile</h2>

      <div className="profile-card">

        {/* IMAGE SECTION */}
        <div className="profile-img-section">
          <img 
            src={preview} 
            alt="Profile"
            className="profile-img"
            onError={(e) => e.target.src="/assets/images/default-avatar.png"}
          />

          <label className="upload-btn">
            Upload New Image
            <input 
              type="file" 
              accept="image/*" 
              hidden 
              onChange={handleImageChange} 
            />
          </label>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          
          <div className="field">
            <label>Name</label>
            <input
              type="text"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label>Email (Read-only)</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="readonly"
            />
          </div>

          <div className="field">
            <label>Phone</label>
            <input
              type="text"
              maxLength={10}
              value={user.phone}
              onChange={(e) => setUser({ ...user, phone: e.target.value })}
            />
          </div>

          <div className="field">
            <label>New Password (optional)</label>
            <input
              type="password"
              placeholder="Leave empty if not changing"
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
            />
          </div>

          <button type="submit" className="save-btn" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default Profile;
