USE food_delivery_analytics;
TRUNCATE TABLE food_delivery;
LOAD DATA LOCAL INFILE 'C:/Users/ADMIN/Desktop/lathii/Food-Delivery-Analytics/data/processed/cleaned_food_delivery.csv'
INTO TABLE food_delivery
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES;

