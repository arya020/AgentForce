// AgentforceService.js - Salesforce Agentforce API Integration for React Native

import AsyncStorage from '@react-native-async-storage/async-storage';

class AgentforceService {
  constructor() {
    this.baseURL = 'https://orgfarm-6495a6f0c5-dev-ed.develop.my.salesforce.com'; // Replace with your Salesforce domain
    this.agentURL = 'https://api.salesforce.com/einstein/ai-agent/v1';
    //this.consumerKey = ''; // Replace with your connected app consumer key
    //this.consumerSecret = ''; // Replace with your connected app consumer secret
    this.agentId = ''; // Replace with your agent ID
    this.accessToken = null;
    this.sessionId = null;
    this.id = this.generateUUID();
  }

   // Step 1: Get Access Token using Client Credentials Flow
    async getAccessToken() {
      try {
        const tokenUrl = `${this.baseURL}/services/oauth2/token`;

        console.log('Attempting to get access token from:', tokenUrl);

        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: `grant_type=client_credentials&client_id=${this.consumerKey}&client_secret=${this.consumerSecret}`,
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        const responseText = await response.text();
        console.log('Response body:', responseText);

//        if (!response.ok) {
//          throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
//        }

        const data = JSON.parse(responseText);

       if (!data.access_token) {
          throw new Error('No access token in response: ' + responseText);
        }

        this.accessToken = data.access_token;

        // Store token locally for future use
        await AsyncStorage.setItem('sf_access_token', this.accessToken);

        console.log('Access token obtained successfully');
        return this.accessToken;
      } catch (error) {
        console.error('Error getting access token:', error);
        console.error('Error details:', error.message);
        throw error;
      }
    }

    // Step 2: Create Agent Session

    async createAgentSession() {
        try {

          if (!this.accessToken) {
               await this.getAccessToken(); // <-- make sure this sets it
          }

          const sessionURL = `${this.agentURL}/agents/${this.agentId}/sessions`;
          const externalSessionKey = this.generateUUID(); // or use this.id if already a UUID

          const payload = {
            externalSessionKey: externalSessionKey,
            instanceConfig: {
              endpoint: `${this.baseURL}`
            },
            streamingCapabilities: {
              chunkTypes: ['Text']
            }
          };

          // Log for debugging
          console.log('Session URL:', sessionURL);
          console.log('Payload:', JSON.stringify(payload));
          console.log('Access Token:', this.accessToken);

          // Make the POST request with correct headers and stringified body
          const response = await fetch(sessionURL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.accessToken}`
            },
            body: JSON.stringify(payload)
          });

          // Check for failure
          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Failed to create session: ${response.status}\n${errText}`);
          }

          //  Parse the response
          const data = await response.json();
          console.log('Session created:', data);


          this.sessionId = data.sessionId;
          const streamUrl = data._links?.messages?.href;
          const endSessionUrl = data._links?.end?.href;
          const initialMessage = data.messages?.[0]?.message || null;

          return {
            sessionId: this.sessionId,
            streamUrl,
            endSessionUrl,
            initialMessage,
            externalSessionKey
          };

        } catch (error) {
          console.error('Error creating session:', error.message);
          throw error;
        }

    }

    // Step 3: Send Message to Agent
    async sendMessage(message) {
      try {
        // Ensure session is created
        if (!this.sessionId) {
          await this.createAgentSession();
        }

        // Set a proper sequenceId — increment or use 1 if first message
        if (!this.sequenceId) {
          this.sequenceId = 1;
        } else {
          this.sequenceId += 1;
        }

        const messageUrl = `https://api.salesforce.com/einstein/ai-agent/v1/sessions/${this.sessionId}/messages`;

        const payload = {
          message: {
            sequenceId: this.sequenceId,
            type: "Text",
            text: message
          }
        };

        console.log("📤 Sending message to:", messageUrl);
        console.log("🧾 Payload:", JSON.stringify(payload));

        const response = await fetch(messageUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`❌ HTTP error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        const aiMessage = data?.messages?.[0]?.message;

        console.log("🧠 AI Message:", aiMessage);
        console.log("✅ Message response:", data);

        return aiMessage;

      } catch (error) {
        console.error('❌ Error sending message:', error.message);
        throw error;
      }
    }


    // Step 4: End Agent Session
    async endSession() {
      try {
        if (!this.sessionId) {
          throw new Error('No active session to end');
        }

        const endSessionUrl = `https://api.salesforce.com/einstein/ai-agent/v1/sessions/${this.sessionId}/messages`;

        const response = await fetch(endSessionUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'x-session-end-reason': 'UserRequest',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        this.sessionId = null;
        return { success: true };
      } catch (error) {
        console.error('Error ending session:', error);
        throw error;
      }
    }

    // Utility function to generate UUID
    generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    // Check if token is still valid
    async isTokenValid() {
      try {
        const response = await fetch(`${this.baseURL}/services/oauth2/userinfo`, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        });
        return response.ok;
      } catch (error) {
        return false;
      }
    }

    // Refresh token if needed
    async refreshTokenIfNeeded() {
      if (!this.accessToken || !(await this.isTokenValid())) {
        await this.getAccessToken();
      }
    }
}

export default AgentforceService;