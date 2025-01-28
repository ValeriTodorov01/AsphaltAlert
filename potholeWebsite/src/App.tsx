import Header from "./components/Header";
import Footer from "./components/Footer";
import MapComponent from "./components/MapComponent";
import { useGeolocated } from "react-geolocated";


function App() {
	const { coords, isGeolocationAvailable, isGeolocationEnabled, getPosition } =
	useGeolocated({
		positionOptions: {
			enableHighAccuracy: false,
		},
		userDecisionTimeout: 8000,
	});

	
	return (
		<>
			<div
				className="flex items-center flex-col h-dvh">
				<Header getPosition={getPosition}/>
				<MapComponent centerCoords={coords}/>
			</div>
			<Footer />
			</>
	);
}

export default App;
