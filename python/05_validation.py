from pathlib import Path
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = BASE_DIR / "data" / "processed" / "cleaned_food_delivery.csv"
KPI_FILE = BASE_DIR / "outputs" / "eda_kpis.csv"
CUSTOMER_FILE = BASE_DIR / "outputs" / "customer_analysis.csv"
OUTPUT_FILE = BASE_DIR / "outputs" / "validation" / "validation_results.csv"


def check(results, condition, name):
    results.append({
        "check": name,
        "status": "PASS" if condition else "FAIL"
    })


def main():
    files = [DATA_FILE, KPI_FILE, CUSTOMER_FILE]

    for file in files:
        if not file.exists():
            raise FileNotFoundError(f"Required file not found: {file}")

    df = pd.read_csv(DATA_FILE)
    kpis = pd.read_csv(KPI_FILE)
    customers = pd.read_csv(CUSTOMER_FILE)

    results = []

    total_orders = df["order_id"].nunique()
    total_revenue = df["order_amount"].sum()
    average_order_value = df["order_amount"].mean()
    average_delivery_time = df["delivery_time"].mean()
    average_rating = df["customer_rating"].mean()

    kpi = dict(zip(kpis["Metric"], kpis["Value"]))

    check(results, int(float(kpi["Total Orders"])) == total_orders, "Total orders match")
    check(results, abs(float(kpi["Total Revenue"]) - total_revenue) < 0.01, "Total revenue matches")
    check(results, abs(float(kpi["Average Order Value"]) - average_order_value) < 0.01, "Average order value matches")
    check(results, abs(float(kpi["Average Delivery Time"]) - average_delivery_time) < 0.01, "Average delivery time matches")
    check(results, abs(float(kpi["Average Customer Rating"]) - average_rating) < 0.01, "Average rating matches")

    check(results, len(customers) == df["customer_id"].nunique(), "Customer count matches")
    check(results, customers["customer_id"].is_unique, "Customer IDs are unique")
    check(results, abs(customers["total_spending"].sum() - total_revenue) < 0.01, "Customer spending matches revenue")
    check(results, customers["total_orders"].sum() == total_orders, "Customer order count matches")

    check(results, not df.isna().any().any(), "No missing values")
    check(results, df["order_id"].is_unique, "Order IDs are unique")
    check(results, df["customer_rating"].between(0, 5).all(), "Ratings are valid")
    check(results, df["order_amount"].ge(0).all(), "Order amounts are valid")
    check(results, df["delivery_time"].ge(0).all(), "Delivery times are valid")

    validation = pd.DataFrame(results)
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    validation.to_csv(OUTPUT_FILE, index=False)

    passed = (validation["status"] == "PASS").sum()
    failed = (validation["status"] == "FAIL").sum()

    print(f"Checks: {len(validation)}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")

    if failed:
        raise ValueError("Validation failed. Check validation_results.csv.")

    print("Validation completed successfully.")


if __name__ == "__main__":
    main()