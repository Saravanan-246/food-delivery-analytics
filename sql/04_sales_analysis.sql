USE food_delivery_analytics;

SELECT
    month,
    month_name,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(SUM(order_amount), 2) AS revenue,
    ROUND(AVG(order_amount), 2) AS average_order_value
FROM food_delivery
GROUP BY month, month_name
ORDER BY month;


SELECT
    city,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(SUM(order_amount), 2) AS revenue,
    ROUND(AVG(order_amount), 2) AS average_order_value
FROM food_delivery
GROUP BY city
ORDER BY revenue DESC;


SELECT
    restaurant_name,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(SUM(order_amount), 2) AS revenue,
    ROUND(AVG(order_amount), 2) AS average_order_value,
    ROUND(AVG(customer_rating), 2) AS average_rating
FROM food_delivery
GROUP BY restaurant_name
ORDER BY revenue DESC;


SELECT
    cuisine,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(SUM(order_amount), 2) AS revenue,
    ROUND(AVG(order_amount), 2) AS average_order_value,
    ROUND(AVG(customer_rating), 2) AS average_rating
FROM food_delivery
GROUP BY cuisine
ORDER BY revenue DESC;


SELECT
    day_name,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(SUM(order_amount), 2) AS revenue,
    ROUND(AVG(order_amount), 2) AS average_order_value
FROM food_delivery
GROUP BY day_name
ORDER BY total_orders DESC;


SELECT
    month_name,
    ROUND(SUM(order_amount), 2) AS revenue,
    ROUND(
        SUM(order_amount) * 100.0 /
        NULLIF((SELECT SUM(order_amount) FROM food_delivery), 0),
        2
    ) AS revenue_percentage
FROM food_delivery
GROUP BY month, month_name
ORDER BY month;