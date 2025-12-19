
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from '../base/Button';
import LoginModal from './LoginModal';
import { authAPI } from '../../services/auth.service';
import { userAPI } from '../../services/user.service';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [responderStatus, setResponderStatus] = useState<'available' | 'busy' | 'offline'>('available');
  const [responderType, setResponderType] = useState<'police' | 'ambulance' | 'fire' | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Check for logged in user
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      if (parsedUser.role === 'responder' || parsedUser.role === 'admin') {
        if (parsedUser.responderStatus) {
          setResponderStatus(parsedUser.responderStatus);
        }
        if (parsedUser.responderType) {
          setResponderType(parsedUser.responderType);
        }
      }
    }
  }, []);

  const handleStatusChange = async (newStatus: 'available' | 'busy' | 'offline') => {
    try {
      const response = await userAPI.updateResponderStatus(newStatus);
      if (response.success) {
        setResponderStatus(newStatus);
        // Update local storage
        const updatedUser = { ...user, responderStatus: newStatus };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    alert('Logged out successfully');
    window.location.href = '/';
  };

  // Get navigation based on user role
  const getNavigation = () => {
    const baseNav = [
      { name: 'Home', href: '/', roles: ['citizen', 'responder', 'admin', null] },
      { name: 'Report Accident', href: '/report', roles: ['citizen', 'responder', 'admin', null] }
    ];

    if (user) {
      if (user.role === 'citizen') {
        baseNav.push({ name: 'My Reports', href: '/my-reports', roles: ['citizen'] });
      }
      if (user.role === 'responder' || user.role === 'admin') {
        baseNav.push({ name: 'Dashboard', href: '/dashboard', roles: ['responder', 'admin'] });
      }
      if (user.role === 'admin') {
        baseNav.push({ name: 'Analytics', href: '/analytics', roles: ['admin'] });
      }
    }

    return baseNav;
  };

  const navigation = getNavigation();

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <i className="ri-alarm-warning-line text-white text-base sm:text-lg"></i>
                </div>
                <span className="text-lg sm:text-xl font-bold text-gray-900">EmergencyAlert</span>
              </Link>
            </div>

            <nav className="hidden lg:flex space-x-6 xl:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-colors cursor-pointer px-2 py-1 ${
                    location.pathname === item.href
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-600 hover:text-red-600'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="hidden lg:flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-3">
                  {user.role === 'responder' && (
                    <select
                      value={responderStatus}
                      onChange={(e) => handleStatusChange(e.target.value as 'available' | 'busy' | 'offline')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg border cursor-pointer ${
                        responderStatus === 'available' ? 'bg-green-50 text-green-700 border-green-300' :
                        responderStatus === 'busy' ? 'bg-red-50 text-red-700 border-red-300' :
                        'bg-gray-50 text-gray-700 border-gray-300'
                      }`}
                    >
                      <option value="available">🟢 Available</option>
                      <option value="busy">🔴 Busy</option>
                      <option value="offline">⚫ Offline</option>
                    </select>
                  )}
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="ri-user-line text-blue-600 text-sm"></i>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-gray-500 capitalize">{user.role}</div>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleLogout}>
                    <i className="ri-logout-box-line mr-2"></i>
                    Logout
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setIsLoginModalOpen(true)}
                >
                  <i className="ri-user-line mr-2"></i>
                  Login
                </Button>
              )}
              <Button 
                size="sm" 
                className="hidden xl:flex"
                onClick={() => window.location.href = 'tel:112'}
              >
                <i className="ri-phone-line mr-2"></i>
                Emergency: 112
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center space-x-2">
              {/* Emergency button for mobile */}
              <Button 
                size="sm" 
                className="px-2 py-1 text-xs"
                onClick={() => window.location.href = 'tel:112'}
              >
                <i className="ri-phone-line text-sm"></i>
                <span className="hidden xs:inline ml-1">112</span>
              </Button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-gray-900 cursor-pointer p-2"
              >
                <i className={`ri-${isMenuOpen ? 'close' : 'menu'}-line text-xl`}></i>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-200 bg-white max-h-[80vh] overflow-y-auto">
              <div className="flex flex-col space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`text-gray-600 hover:text-red-600 px-3 py-3 text-base font-medium cursor-pointer rounded-lg transition-colors ${
                      location.pathname === item.href ? 'bg-red-50 text-red-600' : ''
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <i className={`mr-3 ${
                      item.href === '/' ? 'ri-home-line' :
                      item.href === '/report' ? 'ri-alarm-warning-line' :
                      item.href === '/dashboard' ? 'ri-dashboard-line' :
                      'ri-bar-chart-line'
                    }`}></i>
                    {item.name}
                  </Link>
                ))}
                
                <div className="px-3 pt-4 border-t border-gray-200 mt-4">
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <i className="ri-user-line text-blue-600"></i>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500 capitalize">{user.role}</div>
                        </div>
                      </div>
                      {user.role === 'responder' && (
                        <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                              🚨 Responder Info
                            </div>
                            {responderType && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                responderType === 'police' ? 'bg-blue-100 text-blue-700' :
                                responderType === 'fire' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {responderType === 'police' ? '🚔 Police' :
                                 responderType === 'fire' ? '🚒 Fire' : '🚑 Ambulance'}
                              </span>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Status:</label>
                            <select
                              value={responderStatus}
                              onChange={(e) => {
                                handleStatusChange(e.target.value as 'available' | 'busy' | 'offline');
                                setIsMenuOpen(false); // Close menu after status change
                              }}
                              className={`px-3 py-2 text-sm font-medium rounded-lg border cursor-pointer transition-colors ${
                                responderStatus === 'available' ? 'bg-green-50 text-green-700 border-green-300' :
                                responderStatus === 'busy' ? 'bg-red-50 text-red-700 border-red-300' :
                                'bg-gray-50 text-gray-700 border-gray-300'
                              }`}
                            >
                              <option value="available">🟢 Available</option>
                              <option value="busy">🔴 Busy</option>
                              <option value="offline">⚫ Offline</option>
                            </select>
                          </div>
                        </div>
                      )}
                      <Button variant="secondary" size="sm" onClick={handleLogout} className="w-full">
                        <i className="ri-logout-box-line mr-2"></i>
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="secondary" 
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setIsLoginModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      <i className="ri-user-line mr-2"></i>
                      Login
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </>
  );
}
