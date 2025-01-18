import { useEffect, useRef, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Alert,
	Image,
} from "react-native";
import {
	useCameraPermission,
	useCameraDevice,
	useLocationPermission,
	Camera,
	PhotoFile,
} from "react-native-vision-camera";

export default function App() {
	const device = useCameraDevice("back");
	const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
	const { hasPermission: hasLocationPermission, requestPermission: requestLocationPermission } = useLocationPermission();
	const cameraRef = useRef<Camera>(null);
	const [isWorking, setIsWorking] = useState(false);
	const [photo, setPhoto] = useState<PhotoFile>();
	// const [isWatching, setIsWatching] = useState(false);
	// Request Permissions
	useEffect(() => {
		const requestPermissions = async () => {
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
		};

		requestPermissions();
	}, [hasCameraPermission, hasLocationPermission]);
	

	const onPress = async () => {
		setIsWorking(!isWorking);
		if (!isWorking) {
			console.log("Not taking picktures");
		} else {
			console.log("Pictures are being taken");
		}
	};

	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (isWorking) {
			interval = setInterval(() => {
				takePicture();
			}, 2900);
		} else {
			return () => clearInterval(interval);
		}
		return () => clearInterval(interval);
	}, [isWorking]);

	const takePicture = async () => {
		if (!cameraRef.current) return;

		const photo1 = await cameraRef.current.takePhoto({
			enableShutterSound: false
		});
		setPhoto(photo1);
		console.log("Photo taken:", photo1);
		
			console.log("EXIF Metadata:", photo1.metadata?.["{Exif}"]);
			console.log("Location Permission", Camera.getLocationPermissionStatus());
		
		// sendPhotoToServer(photo1);
	};

	const sendPhotoToServer = async (photo: PhotoFile) => {
		const formData = new FormData();
		const photoBlob = {
			uri: `file://${photo.path}`,
			type: "image/jpg", // Adjust type based on the actual photo format
			name: "photo.jpg",
		} as any;
		formData.append("image", photoBlob);
		try {
			const response = await fetch(
				"http://10.0.2.2:5000/detect_pothole",
				{
					method: "POST",
					body: formData,
					headers: {
						Accept: "application/json",
					},
				}
			);

			if (!response.ok) {
				throw new Error(
					`Server responded with ${response.status} ${response.statusText}`
				);
			}

			const result = await response.json();
			console.log("Server response:", result);
		} catch (error) {
			console.error("Error sending photo to server:", error);
		}
	};

	if (!device) {
		return (
			<View>
				<Text>Loading...</Text>
			</View>
		);
	}

	return (
		<View style={{ flex: 1 }}>
			<Camera
				ref={cameraRef}
				photo={true}
				style={StyleSheet.absoluteFill}
				device={device}
				isActive={true}
				enableLocation={hasLocationPermission}></Camera>
			{isWorking ? (
				<TouchableOpacity style={styles.buttonStop} onPress={onPress} />
			) : (
				<TouchableOpacity
					style={styles.buttonStart}
					onPress={onPress}
				/>
			)}
			{/* <Button title="See video" onPress={handleVideo}/> */}
			{/* {isWatching && <VideoView style={styles.video} player={player} allowsFullscreen allowsPictureInPicture />} */}
			{photo && (
				<Image
					source={{ uri: `file://${photo.path}` }}
					style={styles.video}></Image>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	buttonStart: {
		position: "absolute",
		bottom: 100,
		width: 70,
		height: 70,
		borderRadius: 50,
		backgroundColor: "red",
		alignSelf: "center",
	},
	buttonStop: {
		position: "absolute",
		bottom: 100,
		width: 70,
		height: 70,
		borderColor: "white",
		borderWidth: 5,
		padding: 5,
		backgroundColor: "red",
		alignSelf: "center",
	},
	video: {
		width: 300,
		height: 500,
	},
	backgroundVideo: {
		position: "absolute",
		top: 0,
		left: 0,
		bottom: 0,
		right: 0,
	},
});
