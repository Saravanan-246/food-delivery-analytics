USE food_delivery_analytics;
LOAD DATA LOCAL INFILE 'C:/Users/ADMIN/Desktop/lathii/Food-Delivery-Analytics/data/processed/cleaned_food_delivery.csv'
INTO TABLE food_delivery
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
IGNORE 1 LINES;

