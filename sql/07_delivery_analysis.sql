USE food_delivery_analytics;

SELECT
    delivery_category,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(AVG(delivery_time), 2) AS average_delivery_time,
    ROUND(AVG(customer_rating), 2) AS average_rating,
    ROUND(SUM(order_amount), 2) AS revenue
FROM food_delivery
GROUP BY delivery_category
ORDER BY average_delivery_time;


SELECT
    city,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(AVG(delivery_time), 2) AS average_delivery_time,
    ROUND(AVG(customer_rating), 2) AS average_rating,
    ROUND(SUM(order_amount), 2) AS revenue
FROM food_delivery
GROUP BY city
ORDER BY average_delivery_time;


SELECT
    delivery_category,
    order_status,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(AVG(delivery_time), 2) AS average_delivery_time,
    ROUND(AVG(customer_rating), 2) AS average_rating
FROM food_delivery
GROUP BY delivery_category, order_status
ORDER BY delivery_category, total_orders DESC;


SELECT
    CASE
        WHEN delivery_time <= 30 THEN 'Fast'
        WHEN delivery_time <= 60 THEN 'Normal'
        ELSE 'Delayed'
    END AS delivery_category,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(
        COUNT(DISTINCT order_id) * 100.0 /
        NULLIF((SELECT COUNT(DISTINCT order_id) FROM food_delivery), 0),
        2
    ) AS order_percentage
FROM food_delivery
GROUP BY delivery_category
ORDER BY total_orders DESC;


SELECT
    order_status,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(AVG(delivery_time), 2) AS average_delivery_time,
    ROUND(AVG(customer_rating), 2) AS average_rating,
    ROUND(SUM(order_amount), 2) AS revenue
FROM food_delivery
GROUP BY order_status
ORDER BY total_orders DESC;


SELECT
    CASE
        WHEN delivery_time <= 30 THEN 'Fast'
        WHEN delivery_time <= 60 THEN 'Normal'
        ELSE 'Delayed'
    END AS delivery_category,
    ROUND(AVG(customer_rating), 2) AS average_rating,
    ROUND(AVG(order_amount), 2) AS average_order_value,
    ROUND(SUM(order_amount), 2) AS revenue
FROM food_delivery
GROUP BY delivery_category
ORDER BY average_rating DESC;