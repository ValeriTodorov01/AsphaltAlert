CREATE TABLE pothole (
    id SERIAL PRIMARY KEY,              
    latitude DOUBLE PRECISION NOT NULL, 
    longitude DOUBLE PRECISION NOT NULL,
    severity VARCHAR(50) NOT NULL    
);