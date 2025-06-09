import React from "react";
import ProfileHeader from "../components/ProfileHeader/ProfileHeader";
import CreatorCard from "../components/CreatorCard/CreatorCard";
import backProfile from "../assets/backProfile.png";

export const ProfilePage = () => {
  return (
    <div className="profile" style={{ backgroundImage: `url(${backProfile})` }}>
      <ProfileHeader />
      <div className="profile__list">
        <CreatorCard />
        <CreatorCard />
        <CreatorCard isActive />
      </div>
    </div>
  );
};
