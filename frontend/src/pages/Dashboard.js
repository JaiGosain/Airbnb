import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiHeart, FiMapPin, FiSettings, FiHome } from 'react-icons/fi';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600 mt-2">Manage your account and bookings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="card p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-airbnb-red rounded-full flex items-center justify-center">
                <FiUser className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
                <p className="text-sm text-gray-600">Manage your personal information</p>
              </div>
            </div>
            <Link to="/profile" className="btn-outline w-full">
              Edit Profile
            </Link>
          </div>

          {/* My Bookings */}
          <div className="card p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <FiMapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">My Bookings</h3>
                <p className="text-sm text-gray-600">View and manage your trips</p>
              </div>
            </div>
            <Link to="/my-bookings" className="btn-outline w-full">
              View Bookings
            </Link>
          </div>

          {/* Wishlist */}
          <div className="card p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
                <FiHeart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Wishlist</h3>
                <p className="text-sm text-gray-600">Save your favorite places</p>
              </div>
            </div>
            <Link to="/wishlist" className="btn-outline w-full">
              View Wishlist
            </Link>
          </div>

          {/* Become Host */}
          {!user?.isHost && (
            <div className="card p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <FiHome className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Become a Host</h3>
                  <p className="text-sm text-gray-600">Start hosting and earn money</p>
                </div>
              </div>
              <button className="btn-primary w-full">
                Start Hosting
              </button>
            </div>
          )}

          {/* Host Dashboard */}
          {user?.isHost && (
            <div className="card p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <FiHome className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Host Dashboard</h3>
                  <p className="text-sm text-gray-600">Manage your properties</p>
                </div>
              </div>
              <Link to="/host-dashboard" className="btn-primary w-full">
                Manage Properties
              </Link>
            </div>
          )}

          {/* Settings */}
          <div className="card p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center">
                <FiSettings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
                <p className="text-sm text-gray-600">Account and privacy settings</p>
              </div>
            </div>
            <Link to="/settings" className="btn-outline w-full">
              Manage Settings
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="card p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMapPin className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No recent activity</h3>
              <p className="text-gray-600 mb-4">Start exploring to see your activity here</p>
              <Link to="/search" className="btn-primary">
                Start Exploring
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;



