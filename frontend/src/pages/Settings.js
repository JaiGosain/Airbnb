import React, { useState } from "react";
import { FiChevronLeft, FiUser, FiLock, FiShield } from "react-icons/fi";

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "Jai Gosain",
    email: "jai@example.com",
  });

  const [privacy, setPrivacy] = useState({
    showEmail: false,
    twoFactor: false,
    activitySharing: true,
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = (e) => {
    const { name, checked } = e.target;
    setPrivacy((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    setTimeout(() => {
      setSaving(false);
      setMessage("Settings saved successfully!");
    }, 700);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => window.history.back()}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          <FiChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <FiShield className="w-6 h-6 text-gray-700" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-sm text-gray-500">Manage your account & privacy</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Account Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <FiUser className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium">Account</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Full Name</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleProfileChange}
                className="mt-1 w-full p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                className="mt-1 w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <FiLock className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium">Privacy</h2>
          </div>

          <div className="space-y-4">
            {/* Toggle 1 */}
            <label className="flex justify-between items-center p-3 border rounded-md">
              <div>
                <p className="font-medium">Show email on profile</p>
                <p className="text-sm text-gray-500">Visible to other users</p>
              </div>
              <input
                type="checkbox"
                name="showEmail"
                checked={privacy.showEmail}
                onChange={handleToggle}
                className="h-5 w-5"
              />
            </label>

            {/* Toggle 2 */}
            <label className="flex justify-between items-center p-3 border rounded-md">
              <div>
                <p className="font-medium">Two-factor authentication</p>
                <p className="text-sm text-gray-500">Extra account protection</p>
              </div>
              <input
                type="checkbox"
                name="twoFactor"
                checked={privacy.twoFactor}
                onChange={handleToggle}
                className="h-5 w-5"
              />
            </label>

            {/* Toggle 3 */}
            <label className="flex justify-between items-center p-3 border rounded-md">
              <div>
                <p className="font-medium">Share activity with partners</p>
                <p className="text-sm text-gray-500">
                  Helps improve analytics & features
                </p>
              </div>
              <input
                type="checkbox"
                name="activitySharing"
                checked={privacy.activitySharing}
                onChange={handleToggle}
                className="h-5 w-5"
              />
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-between items-center">
          <p className="text-green-600 text-sm">{message}</p>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
