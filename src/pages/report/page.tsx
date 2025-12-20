
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import Button from '../../components/base/Button';
import Input from '../../components/base/Input';
import Card from '../../components/base/Card';
import Map from '../../components/base/Map';
import { incidentAPI } from '../../services/incident.service';

export default function ReportAccident() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    vehicleNo: '',
    description: '',
    witnessInfo: '',
    location: ''
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Phone number validation: only allow digits and max 10 characters
    if (name === 'contact') {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length <= 10) {
        setFormData(prev => ({
          ...prev,
          [name]: digitsOnly
        }));
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // If location field is manually updated, try to parse coordinates
    if (name === 'location' && value.includes(',')) {
      const [lat, lng] = value.split(',').map(coord => parseFloat(coord.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        setGpsLocation({ lat, lng });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Please enter the location manually or click on the map.');
      return;
    }

    setLoadingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGpsLocation({ lat: latitude, lng: longitude });
        setFormData(prev => ({
          ...prev,
          location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        }));
        setLoadingGPS(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Unable to get your location. ';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'You denied the request for location access. Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'The request to get your location timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
        }
        
        alert(errorMessage + '\n\nYou can manually enter the location or click on the map to set it.');
        setLoadingGPS(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleMapClick = (lat: number, lng: number) => {
    setGpsLocation({ lat, lng });
    setFormData(prev => ({
      ...prev,
      location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gpsLocation) {
      alert('Please enable GPS location or click on the map to set a location.');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Submit to backend API
      const result = await incidentAPI.createIncident(
        {
          name: formData.name,
          contact: formData.contact,
          vehicleNo: formData.vehicleNo,
          location: formData.location,
          coordinates: gpsLocation,
          description: formData.description,
          witnessInfo: formData.witnessInfo,
          severity: determineSeverity(formData.description)
        },
        files
      );

      if (result.success) {
        setReportId(result.data.reportId);
        
        // Show success message
        alert(`Emergency report submitted successfully!\n\nReport ID: ${result.data.reportId}\n\nAutomatic alerts have been sent to:\n• Emergency response teams\n• Nearby responders\n\nExpected response time: 5-10 minutes`);
        
        // Reset form
        setFormData({
          name: '',
          contact: '',
          vehicleNo: '',
          description: '',
          witnessInfo: '',
          location: ''
        });
        setFiles([]);
        setGpsLocation(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error: any) {
      console.error('Error submitting report:', error);
      const errorMessage = error.response?.data?.message || 'Error submitting report. Please try again.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to determine severity based on description keywords
  const determineSeverity = (description: string): 'low' | 'medium' | 'high' | 'critical' => {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('trapped') || lowerDesc.includes('serious injuries') || 
        lowerDesc.includes('unconscious') || lowerDesc.includes('fire') ||
        lowerDesc.includes('rollover') || lowerDesc.includes('multiple vehicles')) {
      return 'critical';
    } else if (lowerDesc.includes('injuries') || lowerDesc.includes('bleeding') ||
               lowerDesc.includes('collision') || lowerDesc.includes('crash')) {
      return 'high';
    } else if (lowerDesc.includes('minor') || lowerDesc.includes('fender bender') ||
               lowerDesc.includes('no injuries')) {
      return 'low';
    }
    return 'medium';
  };

  if (reportId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-check-double-line text-3xl text-green-600"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Report Submitted Successfully</h2>
            <p className="text-gray-600 mb-6">
              Your accident report has been received and is being processed. Emergency responders in your area have been notified.
            </p>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Report ID</h3>
              <p className="text-2xl font-bold text-blue-600">{reportId}</p>
              <p className="text-sm text-gray-500 mt-2">
                Please save this ID for your records. You will receive an email confirmation shortly.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => setReportId(null)}>
                <i className="ri-add-line mr-2"></i>
                Submit Another Report
              </Button>
              <Button variant="secondary" onClick={() => navigate('/my-reports')}>
                <i className="ri-eye-line mr-2"></i>
                Track Status
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Vehicle Accident</h1>
          <p className="text-gray-600">
            Fill out this form to report a vehicle accident. Emergency responders will be notified immediately.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Input
                    label="Full Name *"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    icon="ri-user-line"
                    placeholder="Enter your full name"
                  />
                  <Input
                    label="Contact Number *"
                    name="contact"
                    type="tel"
                    value={formData.contact}
                    onChange={handleInputChange}
                    required
                    icon="ri-phone-line"
                    placeholder="Enter 10 digit phone number"
                    maxLength={10}
                    minLength={10}
                  />
                </div>

                <Input
                  label="Vehicle Number"
                  name="vehicleNo"
                  value={formData.vehicleNo}
                  onChange={handleInputChange}
                  icon="ri-car-line"
                  placeholder="e.g., KA-01-AB-1234"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <div className="flex gap-2">
                    <Input
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      icon="ri-map-pin-line"
                      placeholder="GPS coordinates or address"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={getCurrentLocation}
                      variant="secondary"
                      className="whitespace-nowrap"
                      loading={loadingGPS}
                    >
                      <i className="ri-crosshair-line mr-2"></i>
                      {loadingGPS ? 'Getting GPS...' : 'Get GPS'}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Accident Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Describe what happened, number of vehicles involved, injuries, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Witness Information
                  </label>
                  <textarea
                    name="witnessInfo"
                    value={formData.witnessInfo}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Names and contact details of witnesses (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photo/Video Evidence
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <i className="ri-camera-line text-3xl text-gray-400 mb-2"></i>
                    <p className="text-gray-600 mb-2">Upload photos or videos of the accident scene</p>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="ri-upload-2-line mr-2"></i>
                      Choose Files
                    </Button>
                    {files.length > 0 && (
                      <div className="mt-4 text-sm text-gray-600">
                        {files.length} file(s) selected: {files.map(f => f.name).join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  loading={isSubmitting}
                  className="w-full"
                >
                  <i className="ri-send-plane-line mr-2"></i>
                  {isSubmitting ? 'Submitting Report...' : 'Submit Emergency Report'}
                </Button>
              </form>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Emergency Contacts</h3>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-red-50 rounded-lg">
                  <i className="ri-phone-line text-red-600 mr-3"></i>
                  <div>
                    <div className="font-semibold text-red-900">112</div>
                    <div className="text-sm text-red-700">Emergency Services</div>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <i className="ri-hospital-line text-blue-600 mr-3"></i>
                  <div>
                    <div className="font-semibold text-blue-900">311</div>
                    <div className="text-sm text-blue-700">Non-Emergency</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">What Happens Next?</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-sm font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">AI Verification</div>
                    <div className="text-sm text-gray-600">Report is verified for accuracy</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-sm font-bold text-blue-600">2</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Alert Dispatch</div>
                    <div className="text-sm text-gray-600">Emergency responders notified</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-sm font-bold text-blue-600">3</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Response</div>
                    <div className="text-sm text-gray-600">Help arrives at the scene</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Accident Location</h3>
              <p className="text-sm text-gray-600 mb-3">
                {gpsLocation 
                  ? 'Click on the map to adjust the location'
                  : 'Click on the map or use GPS to set the accident location'
                }
              </p>
              <Map
                center={gpsLocation ? [gpsLocation.lat, gpsLocation.lng] : [15.168307, 76.860621]}
                markers={gpsLocation ? [
                  {
                    position: [gpsLocation.lat, gpsLocation.lng],
                    popup: 'Accident Location'
                  }
                ] : []}
                height="250px"
                onMapClick={handleMapClick}
              />
              {gpsLocation && (
                <p className="text-sm text-gray-600 mt-2">
                  Lat: {gpsLocation.lat.toFixed(6)}, Lng: {gpsLocation.lng.toFixed(6)}
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
