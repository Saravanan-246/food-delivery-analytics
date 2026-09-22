USE food_delivery_analytics;

DROP TABLE IF EXISTS food_delivery;

CREATE TABLE food_delivery (
    order_id INT NOT NULL,
    customer_id VARCHAR(50) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    restaurant_name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    cuisine VARCHAR(100) NOT NULL,
    order_date DATE NOT NULL,
    order_amount DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) NOT NULL,
    delivery_time INT NOT NULL,
    customer_rating DECIMAL(3,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    order_status VARCHAR(30) NOT NULL,
    month INT,
    month_name VARCHAR(20),
    day_name VARCHAR(20),
    weekend_flag BOOLEAN,
    gross_revenue DECIMAL(10,2),
    net_revenue DECIMAL(10,2),
    delivery_category VARCHAR(20),

    PRIMARY KEY (order_id),

    INDEX idx_customer_id (customer_id),
    INDEX idx_order_date (order_date),
    INDEX idx_city (city),
    INDEX idx_restaurant (restaurant_name),
    INDEX idx_cuisine (cuisine),
    INDEX idx_order_status (order_status),

    CONSTRAINT chk_order_amount CHECK (order_amount >= 0),
    CONSTRAINT chk_delivery_fee CHECK (delivery_fee >= 0),
    CONSTRAINT chk_discount CHECK (discount >= 0),
    CONSTRAINT chk_delivery_time CHECK (delivery_time >= 0),
    CONSTRAINT chk_customer_rating CHECK (customer_rating BETWEEN 0 AND 5)
);