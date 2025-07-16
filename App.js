// App.js - Main React Native Application with Salesforce Agentforce Integration

import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import AgentforceChat from './AgentforceChat';

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066cc" />
      <AgentforceChat />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default App;


/*import React, { Component } from 'react';
import {
  View,
  AsyncStorage,
  Linking,
} from 'react-native';

import Login from './Screens/Login';
import Home from './Screens/Home';

export default class App extends Component {

  state = {
    loggedIn: false,
  }

  componentDidMount() {
    Linking.addEventListener('url', this.handleOauthCallback);
  }

  componentWillUnmount() {
    Linking.removeEventListener('url', this.handleOauthCallback);
  }

  handleOauthCallback = async (event) => {
     const fragment = event.url.split('#')[1];
        const params = new URLSearchParams(fragment);
        const loginInfo = {
          instance_url: params.get('instance_url'),
          access_token: params.get('access_token')
        };
    await AsyncStorage.setItem('@dypatilinternationaluniversityakur:instanceUrl', loginInfo.instance_url);
    await AsyncStorage.setItem('@dypatilinternationaluniversityakur:accessToken', loginInfo.access_token);
    this.setState({
      loggedIn: true,
    });
  }

  render() {
    return (
      <View style={{flex: 1}}>
        {!this.state.loggedIn && <Login />}
        {this.state.loggedIn && <Home/>}
      </View>
    );
  }
}*/