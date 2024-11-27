import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Platform, Linking, BackHandler, Text, Button, Pressable, Alert } from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import NetInfo from '@react-native-community/netinfo';

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [webviewKey, setWebviewKey] = useState(1)
  const handleShouldStartLoadWithRequest = (request: any) => {
    const { url } = request;

    // 檢查是否是外部 URL，根據需要進行攔截
    if (!url.startsWith('https://www.zptaiwan.com.tw/')) {
      // 使用 Linking 在系統瀏覽器中打開
      Linking.openURL(url).catch((err) => {
        console.error('Failed to open URL:', err);
      });
      return false; // 阻止 WebView 加載此 URL
    }

    // 允許 WebView 加載 URL
    return true;
  };
  // 相機
  const [scanned, setScanned] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  //接受web來的訊息
  const handleMessage = async (event: any) => {
    const messageData = event.nativeEvent.data;

    if (messageData === 'openScanner') {
      if (!permission || !permission.granted) {
        // 當權限未加載或未授予時，請求權限
        const { granted } = await requestPermission(); // 等待權限請求完成
        if (!granted) {
          Alert.alert('無法開啟相機', '需要相機權限才能進行掃描，請至設定打開相機權限。');
          return; // 如果權限被拒絕，直接返回
        }
      }
      // 確保權限已授予後，打開相機
      setCameraActive(true);
      setScanned(false);
    }
  };
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setCameraActive(false); // 關閉相機
    // 將數據發送回 WebView
    const triggerScannedFunction = `getCodeFromWebview("${data}")`
    webViewRef.current?.injectJavaScript(triggerScannedFunction);
  };
  //Android 返回鍵不會直接關閉 app
  const handleBackButtonPress = () => {
    if (cameraActive) {
      setCameraActive(false); // 關閉相機
      return true;
    }
    if (webViewRef.current) {
      webViewRef.current.goBack();
      return true;
    }
    return false;
  }
  useEffect(() => {
    BackHandler.addEventListener("hardwareBackPress", handleBackButtonPress)
    return () => {
      BackHandler.removeEventListener("hardwareBackPress", handleBackButtonPress)
    };
  }, [cameraActive]);
  const cameraActiveBlock = () => {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
        </CameraView>
        <View style={styles.cameraOverlay}>
          <Pressable style={styles.cancelButton} onPress={() => setCameraActive(false)}>
            <Text style={styles.cancelButtonText}>取消</Text>
          </Pressable>
        </View>
      </View>
    )
  }
  // react-native-webview 的暂时性 bug
  useEffect(() => {
    if (Platform.OS === "ios") {
      setTimeout(() => setWebviewKey(key => key + 1), 50)
    }
  }, [])
  //網路連線檢查
  const unsubscribe = NetInfo.addEventListener(state => {
    if (!state.isConnected || !state.type) {
      return alert('無網路連線，請檢查連線後重試');
    }
  });
  unsubscribe();
  // end 網路連線檢查
  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        key={webviewKey}
        //可使用 iOS 返回手勢
        allowsBackForwardNavigationGestures
        javaScriptEnabled={true}
        style={styles.container}
        javaScriptCanOpenWindowsAutomatically={true}
        setSupportMultipleWindows={true}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        source={{ uri: 'https://www.zptaiwan.com.tw/ezpay' }}
      />
      {cameraActive && cameraActiveBlock()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    marginBottom: 0,
    flex: 1,
    backgroundColor: '#015D63',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBlock: {
    position: 'absolute',
    height: '60%',
    backgroundColor: '#003949',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 0,
    left: 0,
    right: 0,
    flex: 1,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    padding: 20
  },
  barCodeBox: {
    backgroundColor: "tomato",
    alignItems: "center",
    justifyContent: "center",
    width: 300,
    height: 300,
    overflow: "hidden",
    borderRadius: 20,
  },
  cameraContainer: {
    position: 'absolute',
    height: '70%',
    backgroundColor: '#003949',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 0,
    left: 0,
    right: 0,
    flex: 1,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    padding: 20
  },
  camera: {
    backgroundColor: "tomato",
    alignItems: "center",
    justifyContent: "center",
    width: 300,
    height: 300,
    overflow: "hidden",
    borderRadius: 20,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    position: 'absolute',
    bottom: '5%',
    width: '100%',
    padding: 23
  },
  cancelButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#A3A3A3',
    borderRadius: 10,
    marginTop: 30,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 13
  },
});