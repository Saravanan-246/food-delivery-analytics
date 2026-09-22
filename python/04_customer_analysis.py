from pathlib import Path
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent.parent
INPUT_FILE = BASE_DIR / "data" / "processed" / "cleaned_food_delivery.csv"
OUTPUT_FILE = BASE_DIR / "outputs" / "customer_analysis.csv"


def main():
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Dataset not found: {INPUT_FILE}")

    df = pd.read_csv(INPUT_FILE)

    required = {
        "customer_id",
        "order_id",
        "order_amount",
        "customer_rating"
    }

    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns: {sorted(missing)}")

    customers = (
        df.groupby("customer_id", as_index=False)
        .agg(
            total_orders=("order_id", "nunique"),
            total_spending=("order_amount", "sum"),
            average_order_value=("order_amount", "mean"),
            average_rating=("customer_rating", "mean")
        )
    )

    customers["customer_segment"] = pd.cut(
        customers["total_spending"],
        bins=[0, 1000, 3000, float("inf")],
        labels=["Occasional", "Regular", "High Value"],
        include_lowest=True
    )

    if customers["customer_segment"].isna().any():
        raise ValueError("Customer segmentation failed.")

    if customers["total_spending"].lt(0).any():
        raise ValueError("Negative customer spending found.")

    if customers["customer_id"].duplicated().any():
        raise ValueError("Duplicate customer IDs found.")

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    customers.to_csv(OUTPUT_FILE, index=False)

    print(f"Customers analyzed: {len(customers):,}")
    print(f"Saved to: {OUTPUT_FILE}")
    print("\nCustomer segments:")
    print(customers["customer_segment"].value_counts())


if __name__ == "__main__":
    main()