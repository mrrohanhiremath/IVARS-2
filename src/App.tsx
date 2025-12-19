import { BrowserRouter } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AppRoutes } from './router'
import LoadingScreen from './components/base/LoadingScreen'
import { pingServer } from './utils/serverWarmup'


function App() {
  const [isServerReady, setIsServerReady] = useState(false);

  useEffect(() => {
    // Ping server on app load
    const warmup = async () => {
      const ready = await pingServer();
      if (ready) {
        setIsServerReady(true);
      } else {
        // Retry every 2 seconds until server responds
        const interval = setInterval(async () => {
          const ready = await pingServer();
          if (ready) {
            setIsServerReady(true);
            clearInterval(interval);
          }
        }, 2000);

        // Stop trying after 30 seconds and show app anyway
        setTimeout(() => {
          setIsServerReady(true);
          clearInterval(interval);
        }, 30000);
      }
    };

    warmup();
  }, []);

  if (!isServerReady) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter basename={__BASE_PATH__}>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App