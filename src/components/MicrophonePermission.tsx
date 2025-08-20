'use client';

import { useState, useEffect } from 'react';

interface MicrophonePermissionProps {
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
}

export default function MicrophonePermission({ onPermissionGranted, onPermissionDenied }: MicrophonePermissionProps) {
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Check if browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionStatus('denied');
      return;
    }

    // Check current permission status
    checkPermissionStatus();
  }, []);

     const checkPermissionStatus = async () => {
     try {
       // Try to get permission status (this might not work in all browsers)
       const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
       setPermissionStatus(permission.state);
       
       if (permission.state === 'granted') {
         onPermissionGranted();
       }
     } catch (error) {
       // Fallback: try to access microphone to see current status
       try {
         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
         stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
         setPermissionStatus('granted');
         onPermissionGranted();
       } catch (err) {
         // Log the fallback error for debugging
         if (err instanceof Error) {
           console.log('Fallback permission check error:', err.name, err.message);
         }
         setPermissionStatus('denied');
       }
     }
   };

     const requestPermission = async () => {
     setIsRequesting(true);
     
     try {
       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
       stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
       
       setPermissionStatus('granted');
       onPermissionGranted();
     } catch (error) {
       // Log the specific error type for debugging
       if (error instanceof Error) {
         console.log('Microphone permission error type:', error.name);
         console.log('Microphone permission error message:', error.message);
         
         if (error.name === 'NotAllowedError') {
           console.log('User explicitly denied microphone permission');
         } else if (error.name === 'NotFoundError') {
           console.log('No microphone found on device');
         } else if (error.name === 'NotReadableError') {
           console.log('Microphone is in use by another application');
         }
       }
       
       setPermissionStatus('denied');
       onPermissionDenied();
     } finally {
       setIsRequesting(false);
     }
   };

  const openSettings = () => {
    // Show instructions for different browsers
    const instructions = `
To enable microphone access:

Chrome/Edge:
1. Click the microphone icon in the address bar
2. Select "Allow" from the dropdown
3. Refresh the page

Firefox:
1. Click the microphone icon in the address bar
2. Select "Allow" from the dropdown
3. Refresh the page

Safari:
1. Go to Safari > Preferences > Websites > Microphone
2. Find this site and select "Allow"
3. Refresh the page

Mobile:
1. Check your browser settings
2. Ensure microphone permissions are enabled
3. Refresh the page
    `;
    
    alert(instructions);
  };

  if (permissionStatus === 'granted') {
    return null; // Don't show anything if permission is granted
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md mx-4 text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Microphone Access Required
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
          This interview requires voice interaction to properly evaluate your communication skills. 
          Without microphone access, we cannot assess how well you articulate your problem-solving approach.
        </p>

        {permissionStatus === 'denied' ? (
          <div className="space-y-3">
            <p className="text-sm text-red-600 dark:text-red-400">
              Microphone access was denied. Please enable it in your browser settings.
            </p>
            <button
              onClick={openSettings}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              How to Enable Microphone
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Refresh After Enabling
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={requestPermission}
              disabled={isRequesting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isRequesting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Requesting Permission...
                </div>
              ) : (
                'Allow Microphone Access'
              )}
            </button>
            
            <button
              onClick={() => window.location.href = '/problem-select'}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Choose Different Problem
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
