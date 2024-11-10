// Import Amplify library to configure it
import Amplify from 'aws-amplify';

// Import the settings from amplifyconfiguration.js
import awsconfig from './amplifyconfiguration';

// Apply the configuration settings to Amplify
Amplify.configure(awsconfig);
