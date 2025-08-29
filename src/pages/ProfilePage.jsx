import React from "react";
import ProfileHeader from "../components/ProfileHeader/ProfileHeader";
import CreatorCard from "../components/CreatorCard/CreatorCard";

export const ProfilePage = () => {
  return (
    <div className="profile">
      <ProfileHeader />
      <div className="profile__list">
        <CreatorCard />
        <CreatorCard />
        <CreatorCard isActive />
      </div>
    </div>
  );
};
