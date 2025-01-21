import { useEffect, useState } from "react";

interface HeaderProps {
	setModeAddHoleTrue: () => void;
	setCoords: () => void;
}

const Header: React.FC<HeaderProps> = ({ setModeAddHoleTrue, setCoords }) => {
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);

	useEffect(() => {
		const handleResize = () => {
			setWindowWidth(window.innerWidth);
		};

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	return (
		<header className="flex justify-between w-full font-semibold text-[#344050] px-4 sm:px-12 pt-5">
			<div className="flex flex-wrap gap-2 items-center justify-center">
				<img src="Logo.svg" alt="Logo" className="w-11" />
				<h1 className="text-2xl sm:text-3xl">AsphaltAlert</h1>
			</div>

			<div className="flex flex-col sm:flex-row gap-5">
				<button
					className="text-white text-[15px] bg-[#344050] rounded-xl p-3"
					onClick={setCoords}>
					{windowWidth < 640 ? "Nearby Holes" : "Show Nearby Holes"}
				</button>

				<button
					className="flex items-center bg-[#D9D9D9] rounded-xl p-3"
					onClick={() => {
						setModeAddHoleTrue();
						console.log("Add Hole Button Clicked");
					}}>
					{windowWidth < 640 ? "New Hole" : "Add New Hole"}
					<span className="text-2xl sm:text-3xl" style={{ lineHeight: 0 }}>+</span>
				</button>
			</div>
		</header>
	);
};

export default Header;
