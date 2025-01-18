def extract_geolocation(image_path):
    from PIL import Image
    from PIL.ExifTags import TAGS, GPSTAGS

    # Open the image file
    image = Image.open(image_path)

    # Extract EXIF data
    exif_data = image._getexif()
    if not exif_data:
        return None

    # Initialize geolocation variables
    latitude = None
    longitude = None

    # Iterate through EXIF data
    for tag_id, value in exif_data.items():
        tag = TAGS.get(tag_id, tag_id)
        if tag == 'GPSInfo':
            for key in value:
                sub_tag = GPSTAGS.get(key, key)
                if sub_tag == 'GPSLatitude':
                    latitude = value[key]
                elif sub_tag == 'GPSLongitude':
                    longitude = value[key]

    # Convert latitude and longitude to decimal format if available
    if latitude and longitude:
        lat_deg = latitude[0] + latitude[1] / 60 + latitude[2] / 3600
        lon_deg = longitude[0] + longitude[1] / 60 + longitude[2] / 3600
        return lat_deg, lon_deg

    return None