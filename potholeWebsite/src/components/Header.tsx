import { useEffect, useRef, useState } from "react";
import Annotator from "./Annotator";
import { YOLOBox } from "./YOLOBox";

interface HeaderProps {
	getPosition: () => void;
}

const Header = ({ getPosition }: HeaderProps) => {
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);
	const [image, setImage] = useState<File | null>(null);
	const [resizedImage, setResizedImage] = useState<string | null>(null);
	const [isAnnotating, setIsAnnotating] = useState<boolean>(false);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	
	useEffect(() => {
		canvasRef.current = document.createElement("canvas");
	}, []);

	const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files[0]) {
			setImage(event.target.files[0]);
			event.target.value = "";
		}
	};
	
	useEffect(() => {
		resizeImage();
		setIsAnnotating(true);
	}, [image]);

	useEffect(() => {
		const handleResize = () => {
			setWindowWidth(window.innerWidth);
		};

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	const handleOnAnnotationComplete = (yoloBoxes: YOLOBox[]) => {
		yoloBoxes.forEach((box) => {
			console.log("BOX", box);
		});
		if (!canvasRef.current) return;
		canvasRef.current.toBlob(async (blob) => {
			const formData = new FormData();
			if (!blob || !image) return;
			formData.append("image", blob, image.name);
			formData.append("boxes", JSON.stringify(yoloBoxes));

			try {
				const response = await fetch("http://127.0.0.1:5000/upload_image", {
					method: "POST",
					body: formData,
					mode: "cors"
				});

				const data = await response.json();
				console.log("Response:", data);
			} catch (error) {
				console.error("Error uploading image:", error);
			}
			console.log("blob", blob);
		}, "image/jpeg");
		setResizedImage(null);
		setImage(null);
		setIsAnnotating(false);
		
	};

	const resizeImage = () => {
		if (!image) return;

		const reader = new FileReader();
		reader.readAsDataURL(image);
		reader.onload = (event) => {
			const img = new Image();
			img.src = event.target?.result as string;
			img.onload = () => {
				if(!canvasRef.current) return;
				const ctx = canvasRef.current.getContext("2d");
				if (!ctx) return;

				canvasRef.current.width = 640;
				canvasRef.current.height = 480;
				ctx.drawImage(img, 0, 0, 640, 480);
				setResizedImage(canvasRef.current.toDataURL("image/jpeg"));
			};
		};
	};

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setResizedImage(null);
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	

	return (
		<>
			<header className="flex justify-between w-full font-semibold text-[#344050] px-4 sm:px-12 pt-5">
				<div className="flex flex-wrap gap-2 items-center justify-center">
					<img src="Logo.svg" alt="Logo" className="w-11" />
					<h1 className="text-2xl sm:text-3xl">AsphaltAlert</h1>
				</div>

				<div className="flex flex-col sm:flex-row gap-5">
					<button
						className="text-white text-[15px] bg-[#344050] rounded-xl p-3"
						onClick={getPosition}>
						{windowWidth < 640
							? "Nearby Holes"
							: "Show Nearby Holes"}
					</button>

					<label className="flex items-center bg-[#D9D9D9] rounded-xl p-3 cursor-pointer">
						{windowWidth < 640 ? "New Hole" : "Add New Hole"}
						<span className="text-2xl sm:text-3xl ml-2">+</span>
						<input
							type="file"
							accept="image/png,image/jpg,image/jpeg"
							onChange={handleImageUpload}
							className="hidden"
						/>
					</label>
				</div>
			</header>
			{isAnnotating && resizedImage && (
				<Annotator
					imageUrl={resizedImage}
					onComplete={handleOnAnnotationComplete}
					cancelAnnotation={() => {
						setResizedImage(null);
						setImage(null);
						setIsAnnotating(false);
					}}
				/>
			)}
		</>
	);
};

export default Header;
