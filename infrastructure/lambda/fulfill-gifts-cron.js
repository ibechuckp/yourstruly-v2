/**
 * Lambda function to trigger gift fulfillment cron
 * Scheduled via EventBridge to run daily
 */

const https = require('https');

const APP_URL = 'app.yourstruly.love';
const CRON_SECRET = process.env.CRON_SECRET;

exports.handler = async (event) => {
  console.log('Starting gift fulfillment cron...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: APP_URL,
      port: 443,
      path: '/api/cron/fulfill-gifts',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response:', res.statusCode, data);
        
        if (res.statusCode === 200) {
          resolve({
            statusCode: 200,
            body: data,
          });
        } else {
          reject(new Error(`Cron failed with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    req.end();
  });
};
