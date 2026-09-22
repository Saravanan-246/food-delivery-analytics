USE food_delivery_analytics;

SELECT
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(SUM(order_amount), 2) AS total_revenue,
    ROUND(AVG(order_amount), 2) AS average_order_value,
    ROUND(AVG(delivery_time), 2) AS average_delivery_time,
    ROUND(AVG(customer_rating), 2) AS average_customer_rating,
    COUNT(DISTINCT customer_id) AS total_customers,
    ROUND(SUM(delivery_fee), 2) AS total_delivery_fees,
    ROUND(SUM(discount), 2) AS total_discounts,
    ROUND(SUM(net_revenue), 2) AS total_net_revenue
FROM food_delivery;


SELECT
    order_status,
    COUNT(*) AS order_count,
    ROUND(
        COUNT(*) * 100.0 /
        NULLIF((SELECT COUNT(*) FROM food_delivery), 0),
        2
    ) AS order_percentage
FROM food_delivery
GROUP BY order_status
ORDER BY order_count DESC;


SELECT
    delivery_category,
    COUNT(*) AS order_count,
    ROUND(AVG(delivery_time), 2) AS average_delivery_time,
    ROUND(AVG(customer_rating), 2) AS average_rating
FROM food_delivery
GROUP BY delivery_category
ORDER BY average_delivery_time;


SELECT
    payment_method,
    COUNT(*) AS order_count,
    ROUND(SUM(order_amount), 2) AS revenue,
    ROUND(AVG(order_amount), 2) AS average_order_value
FROM food_delivery
GROUP BY payment_method
ORDER BY revenue DESC;