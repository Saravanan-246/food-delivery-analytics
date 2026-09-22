USE food_delivery_analytics;

SELECT
    customer_id,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(SUM(order_amount), 2) AS total_spending,
    ROUND(AVG(order_amount), 2) AS average_order_value,
    ROUND(AVG(customer_rating), 2) AS average_rating,
    CASE
        WHEN SUM(order_amount) <= 1000 THEN 'Occasional'
        WHEN SUM(order_amount) <= 3000 THEN 'Regular'
        ELSE 'High Value'
    END AS customer_segment
FROM food_delivery
GROUP BY customer_id
ORDER BY total_spending DESC;


SELECT
    CASE
        WHEN total_spending <= 1000 THEN 'Occasional'
        WHEN total_spending <= 3000 THEN 'Regular'
        ELSE 'High Value'
    END AS customer_segment,
    COUNT(*) AS customer_count,
    ROUND(SUM(total_spending), 2) AS segment_revenue,
    ROUND(AVG(total_spending), 2) AS average_customer_spending
FROM (
    SELECT
        customer_id,
        SUM(order_amount) AS total_spending
    FROM food_delivery
    GROUP BY customer_id
) AS customers
GROUP BY customer_segment
ORDER BY segment_revenue DESC;


SELECT
    customer_id,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(SUM(order_amount), 2) AS total_spending
FROM food_delivery
GROUP BY customer_id
ORDER BY total_spending DESC
LIMIT 10;