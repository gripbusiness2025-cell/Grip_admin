const environment = process.env.REACT_APP_ENV || 'development';

const config = {
  development: {
    apiUrl: process.env.REACT_APP_API_URL || 'https://api.gripforum.com/api/admin',
    imageBaseUrl: process.env.REACT_APP_IMAGE_URL || 'https://api.gripforum.com/api/public/',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyDguUg1AoVbNpnY8J6F9dLV3PeLkBEYyCw',
    debug: true
  },
  production: {
    apiUrl: process.env.REACT_APP_API_URL || 'https://api.gripforum.com/api/admin',
    imageBaseUrl: process.env.REACT_APP_IMAGE_URL || 'https://api.gripforum.com/api/public/',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyDguUg1AoVbNpnY8J6F9dLV3PeLkBEYyCw',
    debug: false
  }
};


export default config[environment];

// Log config for debugging
if (config[environment].debug) {
  console.log('Environment:', environment);
  console.log('Config:', config[environment]);
}
