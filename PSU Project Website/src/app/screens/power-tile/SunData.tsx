// ============================================================
// SunData.tsx
// ------------------------------------------------------------
// A small custom React hook that fetches today's sunrise and
// sunset times from a free public API and converts them from
// UTC into South African local time (SAST, UTC+2).
// Used by PowerGeneration.tsx to display the Sun Times card.
// ============================================================

import { useState, useEffect } from 'react';

// useSunData — fetches sunrise/sunset for a fixed GPS location once on mount.
// Returns two formatted time strings (HH:mm, 24-hour) to display in the UI.

export const useSunData = () => {
  // "Loading..." is the initial placeholder shown before the API responds
  const [sunrise, setSunrise] = useState<string>('Loading...');
  const [sunset, setSunset] = useState<string>('Loading...');

  useEffect(() => {
    // The sunrise-sunset.org API returns times in UTC when formatted=0.
    // We convert them to local time in the .then() handler below.
    fetch('https://api.sunrise-sunset.org/json?lat=-24.8833&lng=28.2833&formatted=0')
      .then(res => res.json())
      .then(data => {
        // new Date() parses the ISO 8601 UTC string from the API.
        // toLocaleTimeString with 'en-ZA' and hour12:false gives HH:mm
        // in South African time (the browser's local timezone is used
        // for the conversion, so this relies on the user's device being
        // set to SAST — see warning below).
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
        // If the API call fails (network error, API down, etc.),
        // both values fall back to the string "Error".
        // ⚠️  POTENTIAL PROBLEM: The UI just shows "Error" with no
        // retry logic. If the API is temporarily down on page load,
        // the user sees a permanent "Error" until they refresh.
        // Consider adding a retry or a more descriptive fallback message.
        setSunrise('Error');
        setSunset('Error');
      });

    // Empty dependency array: this fetch runs ONCE when the component mounts.
    // ⚠️  POTENTIAL PROBLEM: Sunrise/sunset times change every day, but
    // this hook does NOT re-fetch after midnight or on a schedule.
    // If the dashboard is left open overnight, it will show yesterday's
    // times until the page is refreshed. Adding a daily interval or a
    // date-change check would fix this.
  }, []);

  // ⚠️  POTENTIAL PROBLEM: The timezone conversion relies on
  // toLocaleTimeString() using the user's browser/device timezone.
  // If someone accesses the dashboard from a different timezone,
  // the times will be displayed in THEIR local time, not SAST.
  // For a more robust fix, pass timeZone: 'Africa/Johannesburg' 
  // explicitly to toLocaleTimeString() options.

  return { sunrise, sunset };
};
