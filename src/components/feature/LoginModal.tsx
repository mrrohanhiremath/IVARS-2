
import { useState } from 'react';
import Button from '../base/Button';
import Input from '../base/Input';
import Card from '../base/Card';
import { authAPI } from '../../services/auth.service';

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login
        const result = await authAPI.login({
          email: formData.email,
          password: formData.password
        });
        
        if (result.success) {
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

            <Input
              label="Password *"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              icon="ri-lock-line"
              placeholder="Enter your password"
            />

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
                      <option value="admin">Administrator</option>
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
                <p><span className="font-medium">Admin:</span> Full system access, analytics</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
