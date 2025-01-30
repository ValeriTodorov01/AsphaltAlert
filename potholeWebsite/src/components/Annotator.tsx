import { useEffect, useRef, useState } from "react";
import { YOLOBox } from "./YOLOBox";

interface AnnotatorProps {
	imageUrl: string;
	onComplete: (yoloBoxes: YOLOBox[]) => void;
	cancelAnnotation: () => void;
}

const Annotator = ({
	imageUrl,
	onComplete,
	cancelAnnotation,
}: AnnotatorProps) => {
	const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(
		null
	);
	const [endPos, setEndPos] = useState<{ x: number; y: number } | null>(null);
	const [isDrawing, setIsDrawing] = useState<boolean>(false);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (canvas) {
			ctxRef.current = canvas.getContext("2d");
			if (ctxRef.current) {
				ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
			}
		}
	}, []);

	const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
		if (!canvasRef.current) return;
		setIsDrawing(true);

		const rect = canvasRef.current.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		setStartPos({ x, y });
	};

	const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
		if (!isDrawing || !canvasRef.current || !startPos) return;

		const rect = canvasRef.current.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		setEndPos({ x, y });

		const ctx = ctxRef.current;
		if (ctx) {
			ctx.clearRect(
				0,
				0,
				canvasRef.current.width,
				canvasRef.current.height
			);
			ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
			ctx.fillRect(
				startPos.x,
				startPos.y,
				x - startPos.x,
				y - startPos.y
			);
		}
	};

	const handleMouseUp = () => {
		setIsDrawing(false);
		if (startPos && endPos) {
			const x = Math.min(startPos.x, endPos.x);
			const y = Math.min(startPos.y, endPos.y);
			const width = Math.abs(startPos.x - endPos.x);
			const height = Math.abs(startPos.y - endPos.y);

			const yoloBox: YOLOBox = {
				class: 0,
				x_center: x + width / 2,
				y_center: y + height / 2,
				w: width,
				h: height,
			};

			onComplete([yoloBox]);
		}
	};

    const handleResetBoxes = () => {
        const ctx = ctxRef.current;
        if (ctx && canvasRef.current) {
			ctx.clearRect(
				0,
				0,
				canvasRef.current.width,
				canvasRef.current.height
			);
        }
        setStartPos({ x: 0, y: 0 });
        setEndPos({ x: 0, y: 0 });
    }

	return (
		<div className="flex justify-center items-center absolute w-full h-full bg-gray-700 bg-opacity-80 z-10">
			<canvas
				ref={canvasRef}
				width="640"
				height="480"
				className="absolute z-20 border border-black"
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				style={{ userSelect: "none" }}></canvas>
			<img
				src={imageUrl}
				alt="Annotatable"
				draggable={false}
				className="absolute z-10"
			/>
			<div className="absolute flex gap-4 top-0 mt-2">
				<button
					style={{ userSelect: "none" }}
					className=" top-0 mt-10 border border-black py-2 px-3 rounded-md z-20 bg-white hover:bg-stone-600 hover:text-white hover:transition hover:duration-200 duration-200">
					Submit
				</button>
				<button
					style={{ userSelect: "none" }}
					className=" top-0 mt-10 border border-black py-2 px-3 rounded-md z-20 bg-white hover:bg-stone-600 hover:text-white hover:transition hover:duration-200 duration-200"
                    onClick={handleResetBoxes}>
					Reset boxes
				</button>
				<button
					style={{ userSelect: "none" }}
					className=" top-0 mt-10 border border-black py-2 px-3 rounded-md z-20 bg-white hover:bg-stone-600 hover:text-white hover:transition hover:duration-200 duration-200"
					onClick={cancelAnnotation}>
					Cancel
				</button>
			</div>
		</div>
	);
};

export default Annotator;
