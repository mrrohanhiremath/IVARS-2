
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from '../../components/feature/Header';
import Button from '../../components/base/Button';
import Card from '../../components/base/Card';
import { incidentAPI } from '../../services/incident.service';
import { userAPI } from '../../services/user.service';

export default function Home() {
  const [stats, setStats] = useState({
    totalReports: 0,
    responseRate: 0,
    avgResponseTime: '0 min',
    livesSaved: 0
  });

  useEffect(() => {
    fetchRealStats();
  }, []);

  const fetchRealStats = async () => {
    try {
      // Fetch incidents - public endpoint
      const incidentsResponse = await incidentAPI.getIncidents();
      const incidents = incidentsResponse.data || [];
      
      // Try to fetch responders, but don't fail if unauthorized
      let responders = [];
      try {
        const respondersResponse = await userAPI.getResponders();
        responders = respondersResponse.data || [];
      } catch (responderError: any) {
        // Ignore 401 errors for responders endpoint - user not logged in
        if (responderError?.response?.status !== 401) {
          console.error('Failed to fetch responders:', responderError);
        }
      }

      // Calculate stats
      const totalReports = incidents.length;
      const resolvedIncidents = incidents.filter((i: any) => i.status === 'resolved').length;
      const activeIncidents = incidents.filter((i: any) => i.status === 'active').length;
      const responseRate = totalReports > 0 ? ((resolvedIncidents + activeIncidents) / totalReports * 100).toFixed(1) : '0';
      
      // Calculate average response time from incidents with ETA
      const incidentsWithETA = incidents.filter((i: any) => i.estimatedResponseTime);
      let avgMinutes = 4.2; // Default
      if (incidentsWithETA.length > 0) {
        const totalMinutes = incidentsWithETA.reduce((sum: number, i: any) => {
          const eta = i.estimatedResponseTime;
          // Parse ETA (e.g., "15 mins" or "1 hour 20 mins")
          let minutes = 0;
          if (eta.includes('hour')) {
            const hours = parseInt(eta.match(/(\d+)\s*hour/)?.[1] || '0');
            minutes += hours * 60;
          }
          if (eta.includes('min')) {
            minutes += parseInt(eta.match(/(\d+)\s*min/)?.[1] || '0');
          }
          return sum + minutes;
        }, 0);
        avgMinutes = (totalMinutes / incidentsWithETA.length).toFixed(1);
      }

      // Estimate lives saved (resolved critical and high severity incidents)
      const livesSaved = incidents.filter((i: any) => 
        i.status === 'resolved' && (i.severity === 'critical' || i.severity === 'high')
      ).length;

      setStats({
        totalReports,
        responseRate: parseFloat(responseRate),
        avgResponseTime: `${avgMinutes} min`,
        livesSaved
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Keep default values on error
    }
  };
  const features = [
    {
      icon: 'ri-smartphone-line',
      title: 'Instant Reporting',
      description: 'Report accidents quickly with GPS location and photo evidence'
    },
    {
      icon: 'ri-time-line',
      title: 'Real-time Response',
      description: 'Emergency responders are notified immediately via SMS and alerts'
    },
    {
      icon: 'ri-map-pin-line',
      title: 'GPS Tracking',
      description: 'Automatic location detection with manual adjustment options'
    },
    {
      icon: 'ri-hospital-line',
      title: 'Nearby Resources',
      description: 'Automatically finds nearby hospitals, police stations, and fire departments with smart scoring'
    },
    {
      icon: 'ri-bar-chart-line',
      title: 'Analytics Dashboard',
      description: 'Comprehensive analytics for accident patterns and response times'
    },
    {
      icon: 'ri-navigation-line',
      title: 'Smart Navigation',
      description: 'Google Maps integration with real-time ETA calculation and turn-by-turn directions'
    }
  ];

  const statsDisplay = [
    { number: stats.totalReports.toLocaleString(), label: 'Reports Processed', icon: 'ri-file-text-line' },
    { number: `${stats.responseRate}%`, label: 'Response Rate', icon: 'ri-check-double-line' },
    { number: stats.avgResponseTime, label: 'Avg Response Time', icon: 'ri-timer-line' },
    { number: stats.livesSaved.toLocaleString(), label: 'Lives Saved', icon: 'ri-heart-pulse-line' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section 
        className="relative bg-cover bg-center bg-no-repeat min-h-screen flex items-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://readdy.ai/api/search-image?query=Emergency%20response%20vehicles%20ambulance%20and%20police%20cars%20rushing%20through%20city%20streets%20with%20flashing%20lights%2C%20dramatic%20urban%20background%20with%20modern%20buildings%2C%20professional%20emergency%20services%20photography%2C%20high%20contrast%20lighting%2C%20sense%20of%20urgency%20and%20movement&width=1920&height=1080&seq=hero-emergency&orientation=landscape')`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 sm:py-16 lg:py-20">
          <div className="max-w-4xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Emergency Response
              <span className="text-red-400 block">When Every Second Counts</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-200 mb-6 sm:mb-8 leading-relaxed max-w-3xl">
              Advanced AI-powered accident reporting system that connects citizens with emergency responders in real-time. Report incidents instantly with GPS tracking, photo evidence, and automated emergency notifications.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link to="/report" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-sm sm:text-base">
                  <i className="ri-alarm-warning-line mr-2 sm:mr-3 text-base sm:text-lg"></i>
                  Report Emergency Now
                </Button>
              </Link>
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto bg-white/10 text-white border border-white/20 hover:bg-white/20 text-sm sm:text-base">
                  <i className="ri-dashboard-line mr-2 sm:mr-3 text-base sm:text-lg"></i>
                  Access Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {statsDisplay.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <i className={`${stat.icon} text-lg sm:text-2xl text-red-600`}></i>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{stat.number}</div>
                <div className="text-xs sm:text-sm lg:text-base text-gray-600 font-medium px-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Advanced Emergency Response Features
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Our comprehensive platform combines cutting-edge technology with human expertise to deliver the fastest, most reliable emergency response system available.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300 p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                  <i className={`${feature.icon} text-lg sm:text-xl text-red-600`}></i>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">How It Works</h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">Simple steps to get emergency help when you need it most</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Report Incident</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Quickly report the accident with our mobile-friendly interface. GPS location is automatically detected, and you can upload photos or videos as evidence.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Smart Resource Finding</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                System automatically locates nearby hospitals, police stations, and fire departments using Google Maps. Smart scoring prioritizes open facilities and optimal routes.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Emergency Response</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Nearest emergency responders are immediately notified via SMS, WhatsApp, and real-time dashboard alerts. Help is on the way!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-red-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-red-100 mb-6 sm:mb-8 leading-relaxed">
            Join thousands of citizens and emergency responders using our platform to save lives and make communities safer.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link to="/report" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-red-700 text-white border-red-500 hover:bg-red-800 text-sm sm:text-base">
                <i className="ri-add-circle-line mr-2 sm:mr-3 text-base sm:text-lg"></i>
                Start Reporting
              </Button>
            </Link>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto bg-red-700 text-white border-red-500 hover:bg-red-800 text-sm sm:text-base">
              <i className="ri-team-line mr-2 sm:mr-3 text-base sm:text-lg"></i>
              Join as Responder
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <i className="ri-alarm-warning-line text-white text-lg"></i>
                </div>
                <span className="text-xl font-bold text-white">EmergencyAlert</span>
              </div>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                Advanced emergency response system connecting citizens with first responders through AI-powered technology.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/report" className="hover:text-white cursor-pointer text-sm sm:text-base">Report Accident</Link></li>
                <li><Link to="/dashboard" className="hover:text-white cursor-pointer text-sm sm:text-base">Dashboard</Link></li>
                <li><Link to="/analytics" className="hover:text-white cursor-pointer text-sm sm:text-base">Analytics</Link></li>
                <li><a href="#" className="hover:text-white cursor-pointer text-sm sm:text-base">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Emergency Contacts</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-sm sm:text-base">
                  <i className="ri-phone-line mr-2"></i>
                  112 - Emergency
                </li>
                <li className="flex items-center text-sm sm:text-base">
                  <i className="ri-hospital-line mr-2"></i>
                  311 - Non-Emergency
                </li>
                <li className="flex items-center text-sm sm:text-base">
                  <i className="ri-customer-service-2-line mr-2"></i>
                  24/7 Support
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Stay Connected</h3>
              <div className="flex space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 cursor-pointer">
                  <i className="ri-facebook-fill text-sm sm:text-lg"></i>
                </a>
                <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 cursor-pointer">
                  <i className="ri-twitter-fill text-sm sm:text-lg"></i>
                </a>
                <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 cursor-pointer">
                  <i className="ri-linkedin-fill text-sm sm:text-lg"></i>
                </a>
              </div>
              <p className="text-xs sm:text-sm text-gray-400">
                Get updates on new features and emergency alerts in your area.
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-gray-400 text-xs sm:text-sm text-center sm:text-left">
              © 2024 EmergencyAlert. All rights reserved. Saving lives through technology.
            </p>
            <a href="https://readdy.ai/?origin=logo" className="text-gray-400 hover:text-white text-xs sm:text-sm cursor-pointer">
              Powered by EduTeck-2k24
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
