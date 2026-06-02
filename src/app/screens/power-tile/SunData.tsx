import { useState, useEffect } from 'react';

export const useSunData = () => {
  const [sunrise, setSunrise] = useState<string>('Loading...');
  const [sunset, setSunset] = useState<string>('Loading...');

  useEffect(() => {
    fetch('https://api.sunrise-sunset.org/json?lat=-24.8833&lng=28.2833&formatted=0')
      .then(res => res.json())
      .then(data => {
        // CONVERSION HAPPENS HERE
        const sr = new Date(data.results.sunrise).toLocaleTimeString('en-ZA', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
        const ss = new Date(data.results.sunset).toLocaleTimeString('en-ZA', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });

        setSunrise(sr);
        setSunset(ss);
      })
      .catch(() => {
        setSunrise('Error');
        setSunset('Error');
      });
  }, []);

  return { sunrise, sunset };
};