USE food_delivery_analytics;

SELECT
    restaurant_name,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(SUM(order_amount), 2) AS revenue,
    ROUND(AVG(order_amount), 2) AS average_order_value,
    ROUND(AVG(customer_rating), 2) AS average_rating,
    ROUND(AVG(delivery_time), 2) AS average_delivery_time
FROM food_delivery
GROUP BY restaurant_name
ORDER BY revenue DESC;

SELECT
    cuisine,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(SUM(order_amount), 2) AS revenue,
    ROUND(AVG(order_amount), 2) AS average_order_value,
    ROUND(AVG(customer_rating), 2) AS average_rating,
    ROUND(AVG(delivery_time), 2) AS average_delivery_time
FROM food_delivery
GROUP BY cuisine
ORDER BY revenue DESC;

SELECT
    restaurant_name,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(SUM(order_amount), 2) AS revenue
FROM food_delivery
GROUP BY restaurant_name
ORDER BY total_orders DESC, revenue DESC
LIMIT 10;

SELECT
    cuisine,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(SUM(order_amount), 2) AS revenue
FROM food_delivery
GROUP BY cuisine
ORDER BY total_orders DESC, revenue DESC
LIMIT 10;

SELECT
    restaurant_name,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(AVG(customer_rating), 2) AS average_rating,
    ROUND(AVG(delivery_time), 2) AS average_delivery_time
FROM food_delivery
GROUP BY restaurant_name
HAVING COUNT(DISTINCT order_id) >= 2
ORDER BY average_rating DESC, average_delivery_time ASC;