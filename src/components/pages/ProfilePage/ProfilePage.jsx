import React from 'react';
import UserProfile from '../../organisms/UserProfile/UserProfile';
import './ProfilePage.css';

const ProfilePage = () => {
  return (
    <div className="profile-page">
      <div className="profile-container">
        <UserProfile />
      </div>
    </div>
  );
};

export default ProfilePage;
