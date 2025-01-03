import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Button } from "react-native";
import { useCameraPermission, useCameraDevice, Camera } from "react-native-vision-camera";
// import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { useVideoPlayer, VideoView } from 'expo-video';


export default function App() {
  const device = useCameraDevice('back')
  const { hasPermission, requestPermission } = useCameraPermission()
  const cameraRef = useRef(null)
  const [isRecording, setIsRecording] = useState(false)
  const [video, setVideo] = useState(null)
  const [videoSource, setVideoSource] = useState(null)
  const [isWatching, setIsWatching] = useState(false)
  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.play();
  });


  const onPress = async () => {
    if (isRecording) {
      await cameraRef.current.stopRecording()
      console.log("Recording stopped")
    }
    else {
      setIsRecording(true)
      console.log("Recording started")
      
      await cameraRef.current.startRecording({
        onRecordingFinished: (video) => {
          console.log(video)
          setIsRecording(false)
          setVideo(video)
          setVideoSource(video.path)
        },
        onRecordingError: (error) => {
          console.warn(error)
          setIsRecording(false)
        }
      }) 
    } 
  }

  const handleVideo = () => {
    setIsWatching(!isWatching)
    console.log("Video is being watched")
    console.log(videoSource)
  }

  useEffect(() => {
    if (!hasPermission) {
      requestPermission()
    }
  }, [hasPermission])

  if(!device) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={{ block: 'relative', width: '100%', height: '100%' }}>
      <Camera ref={cameraRef} video={true} style={StyleSheet.absoluteFill} device={device} isActive={true}></Camera>
      {isRecording ? (
        <TouchableOpacity style={styles.buttonStop} onPress={onPress} />
      ) : (
        <TouchableOpacity style={styles.buttonStart} onPress={onPress} />
      )}
      <Button title="See video" onPress={handleVideo}/>
      {isWatching && <VideoView style={styles.video} player={player} allowsFullscreen allowsPictureInPicture />}
    </View>
  );
}

const styles = StyleSheet.create({
  buttonStart: {
      position: 'absolute',
      bottom: 100,
      width: 70,
      height: 70,
      borderRadius: 50,
      backgroundColor: 'red',
      alignSelf: 'center'
  },
  buttonStop: {
    position: 'absolute',
    bottom: 100,
    width: 70,
    height: 70,
    borderColor: 'white',
    borderWidth: 5,
    padding: 5,
    backgroundColor: 'red',
    alignSelf: 'center'
  },
  video: {
    width: 300,
    height: 500,
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  }
})


