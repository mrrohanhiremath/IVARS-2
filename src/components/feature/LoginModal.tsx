import { useState } from 'react';
import Button from '../base/Button';
import Input from '../base/Input';
import Card from '../base/Card';
import { authAPI } from '../../services/auth.service';
import { userAPI } from '../../services/user.service';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'citizen',
    responderType: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const validatePassword = (password: string): string => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)';
    }
    return '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Validate password in real-time during signup
    if (name === 'password' && !isLogin) {
      const error = validatePassword(value);
      setPasswordError(error);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getLocationAndUpdate = async () => {
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const locationString = `${latitude},${longitude}`;
            
            try {
              await userAPI.updateLocation(locationString);
              console.log('Location updated:', locationString);
            } catch (error) {
              console.error('Failed to update location:', error);
            }
            resolve(locationString);
          },
          (error) => {
            console.error('Geolocation error:', error);
            resolve(null);
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      } else {
        console.log('Geolocation not supported');
        resolve(null);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password on signup
    if (!isLogin) {
      const error = validatePassword(formData.password);
      if (error) {
        setPasswordError(error);
        alert(error);
        return;
      }
    }
    
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login
        const result = await authAPI.login({
          email: formData.email,
          password: formData.password
        });
        
        if (result.success) {
          // If user is a responder, get and update location
          const userData = localStorage.getItem('user');
          if (userData) {
            const user = JSON.parse(userData);
            if (user.role === 'responder') {
              await getLocationAndUpdate();
            }
          }
          alert('Login successful! Welcome to EmergencyAlert.');
        }
      } else {
        // Register
        const registerData: any = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        };
        
        // Add responder-specific fields if role is responder
        if (formData.role === 'responder') {
          registerData.responderType = formData.responderType || 'ambulance';
          registerData.responderStatus = 'available'; // Default to available
          registerData.location = ''; // Can be updated later
        }
        
        const result = await authAPI.register(registerData);
        
        if (result.success) {
          alert('Registration successful! Welcome to EmergencyAlert.');
        }
      }
      
      // Reset form and close modal
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'citizen',
        responderType: ''
      });
      onClose();
      
      // Reload to update header
      window.location.reload();
      
    } catch (error: any) {
      console.error('Auth error:', error);
      const errorMessage = error.response?.data?.message || 'Authentication failed. Please try again.';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md">
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isLogin ? 'Login' : 'Create Account'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                label="Full Name *"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                icon="ri-user-line"
                placeholder="Enter your full name"
              />
            )}

            <Input
              label="Email Address *"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              icon="ri-mail-line"
              placeholder="Enter your email"
            />

            <div>
              <Input
                label="Password *"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                icon="ri-lock-line"
                placeholder={isLogin ? "Enter your password" : "Min 8 chars, A-z, 0-9, special char"}
              />
              {!isLogin && passwordError && (
                <p className="mt-1 text-xs text-red-600">
                  <i className="ri-error-warning-line mr-1"></i>
                  {passwordError}
                </p>
              )}
              {!isLogin && !passwordError && formData.password && (
                <p className="mt-1 text-xs text-green-600">
                  <i className="ri-checkbox-circle-line mr-1"></i>
                  Password meets all requirements
                </p>
              )}
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Type *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="ri-shield-user-line text-gray-400 text-sm"></i>
                    </div>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="citizen">Citizen</option>
                      <option value="responder">Emergency Responder</option>
                      {/* <option value="admin">Administrator</option> */}
                    </select>
                  </div>
                </div>

                {formData.role === 'responder' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Responder Type *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i className="ri-emergency-line text-gray-400 text-sm"></i>
                      </div>
                      <select
                        name="responderType"
                        value={formData.responderType}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">Select responder type</option>
                        <option value="police">Police</option>
                        <option value="ambulance">Ambulance</option>
                        <option value="fire">Fire Department</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}

            <Button
              type="submit"
              loading={isLoading}
              className="w-full"
            >
              <i className={`ri-${isLogin ? 'login' : 'user-add'}-line mr-2`}></i>
              {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 text-red-600 hover:text-red-700 font-medium cursor-pointer"
              >
                {isLogin ? 'Sign up' : 'Login'}
              </button>
            </p>
          </div>

          {isLogin && (
            <div className="mt-4 text-center">
              <button className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
                Forgot your password?
              </button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              <p className="mb-2">Emergency Access Roles:</p>
              <div className="space-y-1">
                <p><span className="font-medium">Citizen:</span> Report accidents, track status</p>
                <p><span className="font-medium">Responder:</span> Receive alerts, update status</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
