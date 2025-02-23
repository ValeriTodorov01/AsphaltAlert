CREATE TABLE dangers (
    id SERIAL PRIMARY KEY,              
    latitude DOUBLE PRECISION NOT NULL, 
    longitude DOUBLE PRECISION NOT NULL,
    severity VARCHAR(16) NOT NULL,  
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP 
);

CREATE TABLE "yoloBoxes" (
    id SERIAL PRIMARY KEY,       
    class_id INTEGER NOT NULL,       
    x_center DOUBLE PRECISION NOT NULL, 
    y_center DOUBLE PRECISION NOT NULL, 
    width INTEGER NOT NULL,         
    height INTEGER NOT NULL,          
    file_name VARCHAR(255) NOT NULL 
);
