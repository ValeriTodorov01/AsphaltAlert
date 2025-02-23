import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  useCameraPermission,
  useCameraDevice,
  useLocationPermission,
  Camera,
  PhotoFile,
  useCameraFormat,
} from "react-native-vision-camera";
import Geolocation from "react-native-geolocation-service";

export default function App() {
  const device = useCameraDevice("back");
  const format = useCameraFormat(device, [
    { photoResolution: { width: 640, height: 480 } },
  ]);

  const {
    hasPermission: hasCameraPermission,
    requestPermission: requestCameraPermission,
  } = useCameraPermission();
  const {
    hasPermission: hasLocationPermission,
    requestPermission: requestLocationPermission,
  } = useLocationPermission();

  const cameraRef = useRef<Camera>(null);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    (async () => {
      if (!hasCameraPermission) {
        const cameraStatus = await requestCameraPermission();
        if (cameraStatus !== true) {
          Alert.alert("Error", "Camera permission is required to use this app.");
          return;
        }
      }
      if (!hasLocationPermission) {
        const locationStatus = await requestLocationPermission();
        if (locationStatus !== true) {
          Alert.alert("Error", "Location permission is required to geotag photos.");
        }
      }
    })();
  }, [
    hasCameraPermission,
    hasLocationPermission,
    requestCameraPermission,
    requestLocationPermission,
  ]);

  const getPosition = (): Promise<Geolocation.GeoPosition> =>
    new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        resolve,
        reject,
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 1800 }
      );
    });

  const sendPhotoToServer = async (capturedPhoto: PhotoFile, position: Geolocation.GeoPosition) => {
    const formData = new FormData();
    const photoBlob = {
      uri: `file://${capturedPhoto.path}`,
      type: "image/jpg",
      name: "photo.jpg",
    } as any;

    formData.append("image", photoBlob);
    formData.append("longitude", position.coords.longitude.toString());
    formData.append("latitude", position.coords.latitude.toString());

    try {
      console.log("Sending photo to server...");
      const response = await fetch("http://192.168.0.107:5000/detect_danger", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status} ${response.statusText}`);
      }
      const result = await response.json();
      console.log("Server response:", result);
    } catch (error) {
      console.error("Error sending photo to server:", error);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      console.log("Capturing photo...");
      const [capturedPhoto, position] = await Promise.all([
        cameraRef.current.takePhoto({ enableShutterSound: false }),
        getPosition(),
      ]);
      await sendPhotoToServer(capturedPhoto, position);
    } catch (error) {
      console.error("Error capturing photo or getting position:", error);
    }
  };

  const onPress = () => {
    setIsWorking((prev) => !prev);
  };

  useEffect(() => {
    if (!isWorking) return;
    const intervalId = setInterval(() => {
      takePicture();
    }, 2000);
    return () => clearInterval(intervalId);
  }, [isWorking]);

  if (!device) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Camera
        ref={cameraRef}
        photo
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        enableLocation={false}
        format={format}
        resizeMode="contain"
      />
      <TouchableOpacity
        style={isWorking ? styles.buttonStop : styles.buttonStart}
        onPress={onPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  buttonStart: {
    position: "absolute",
    bottom: 100,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "red",
    alignSelf: "center",
  },
  buttonStop: {
    position: "absolute",
    bottom: 100,
    width: 70,
    height: 70,
    borderRadius: 35,
    borderColor: "white",
    borderWidth: 5,
    backgroundColor: "red",
    alignSelf: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
