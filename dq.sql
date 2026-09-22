USE food_delivery_analytics;
SELECT
  (SELECT COUNT(*) FROM food_delivery) AS total_rows,
  (SELECT COUNT(DISTINCT order_id) FROM food_delivery) AS unique_orders,
  (SELECT COUNT(DISTINCT customer_id) FROM food_delivery) AS unique_customers,
  (SELECT COUNT(*) FROM food_delivery WHERE customer_rating < 0 OR customer_rating > 5) AS invalid_ratings,
  (SELECT COUNT(*) FROM food_delivery WHERE order_amount < 0) AS neg_amount,
  (SELECT COUNT(*) FROM food_delivery WHERE delivery_fee < 0) AS neg_fee,
  (SELECT COUNT(*) FROM food_delivery WHERE discount < 0) AS neg_discount,
  (SELECT COUNT(*) FROM food_delivery WHERE delivery_time < 0) AS neg_time,
  (SELECT COUNT(*) FROM food_delivery WHERE delivery_category NOT IN ('Fast', 'Normal', 'Delayed')) AS invalid_cat;

