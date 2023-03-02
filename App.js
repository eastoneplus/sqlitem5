import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, Image, Button, Platform} from "react-native";

import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';





export default function App() {
  const [userInfo, setUserInfo] = useState();
  const [auth, setAuth] = useState();
  const [requireRefresh, setRequireRefresh] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId:
      "",
    iosClientId:
      "452200857874-fr5a0g1dcv38jrr1i5r6eovtqqbsm34f.apps.googleusercontent.com",
    expoClientId:
      "452200857874-1ke9cojcmchedn2cr2o3497avi7causf.apps.googleusercontent.com"
  });
  useEffect(() => {
    console.log(response);
    if (response?.type === "success") {
      setAuth(response.authentication);

      const persistAuth = async () => {
        await AsyncStorage.setItem("auth", JSON.stringify(response.authentication));
      };
      persistAuth();
    }
  }, [response]);

  useEffect(() => {
    const getPersistedAuth = async () => {
      const jsonValue = await AsyncStorage.getItem("auth");
      if (jsonValue != null) {
        const authFromJson = JSON.parse(jsonValue);
        setAuth(authFromJson);
        console.log(authFromJson);

        setRequireRefresh(!AuthSession.TokenResponse.isTokenFresh({
          expiresIn: authFromJson.expiresIn,
          issuedAt: authFromJson.issuedAt
        }));
      }
    };
    getPersistedAuth();
  }, []);

  const getUserData = async () => {
    let userInfoResponse = await fetch("https://www.googleapis.com/userinfo/v2/me", {
      headers: { Authorization: `Bearer ${auth.accessToken}` }
    });

    userInfoResponse.json().then(data => {
      console.log(data);
      setUserInfo(data);
    });
  };

  const showUserData = () => {
    if (userInfo) {
      return (
        <View style={styles.userInfo}>
          <Image source={{ uri: userInfo.picture }} style={styles.profilePic} />
          <Text>Welcome {userInfo.name}</Text>
          <Text>{userInfo.email}</Text>
        </View>
      );
    }
  };

  const getClientId = () => {
    if (Platform.OS === "ios") {
      return "452200857874-fr5a0g1dcv38jrr1i5r6eovtqqbsm34f.apps.googleusercontent.com";
    } else if (Platform.OS === "android") {
      return "";
    } else {
      return "452200857874-1ke9cojcmchedn2cr2o3497avi7causf.apps.googleusercontent.com";
      console.log("Invalid platform - not handled");
    }
  }

  const refreshToken = async () => {
    const clientId = getClientId();
    console.log("aaaaaa"+auth);
    const tokenResult = await AuthSession.refreshAsync({
      clientId: clientId,
      refreshToken: auth.refreshToken
    }, {
      tokenEndpoint: "https://www.googleapis.com/oauth2/v4/token"
    });

    tokenResult.refreshToken = auth.refreshToken;

    setAuth(tokenResult);
    await AsyncStorage.setItem("auth", JSON.stringify(tokenResult));
    setRequireRefresh(false);
  };

  if (requireRefresh) {
    return (
      <View style={styles.container}>
        <Text>Token requires refresh...</Text>
        <Button title="Refresh Token" onPress={refreshToken} />
      </View>
    )
  }

  const logout = async () => {
    await AuthSession.revokeAsync({
      token: auth.accessToken
    }, {
      revocationEndpoint: "https://oauth2.googleapis.com/revoke"
    });

    setAuth(undefined);
    setUserInfo(undefined);
    await AsyncStorage.removeItem("auth");
  };



  return <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <Text>sqlitem5 55555555</Text>


      {showUserData()}
      <Button title={auth ? "Get User Data" : "Login"} onPress={auth ? getUserData : () => promptAsync(
                  { useProxy: false, showInRecents: true }
                )} />
      {auth ? <Button title="Logout" onPress={logout} /> : undefined}
      <StatusBar style="auto" />
    </View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E9D0A5",
    alignItems: "center",
    justifyContent: "center"
  }
});
