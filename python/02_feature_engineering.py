from pathlib import Path
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent.parent
INPUT_FILE = BASE_DIR / "data" / "processed" / "cleaned_food_delivery.csv"
OUTPUT_FILE = BASE_DIR / "data" / "processed" / "cleaned_food_delivery.csv"


def main():
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Cleaned dataset not found: {INPUT_FILE}")

    df = pd.read_csv(INPUT_FILE, parse_dates=["order_date"])

    required = {
        "order_date",
        "order_amount",
        "delivery_fee",
        "discount",
        "delivery_time"
    }

    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns: {sorted(missing)}")

    df["month"] = df["order_date"].dt.month
    df["month_name"] = df["order_date"].dt.month_name()
    df["day_name"] = df["order_date"].dt.day_name()
    df["weekend_flag"] = df["order_date"].dt.dayofweek >= 5

    df["gross_revenue"] = df["order_amount"] + df["delivery_fee"]
    df["net_revenue"] = (
        df["order_amount"]
        + df["delivery_fee"]
        - df["discount"]
    )

    df["delivery_category"] = pd.cut(
        df["delivery_time"],
        bins=[-float("inf"), 30, 60, float("inf")],
        labels=["Fast", "Normal", "Delayed"]
    )

    if df["net_revenue"].isna().any():
        raise ValueError("Invalid revenue values found.")

    if df["delivery_category"].isna().any():
        raise ValueError("Invalid delivery_time values found.")

    if df["order_id"].duplicated().any():
        raise ValueError("Duplicate order_id values found.")

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_FILE, index=False)

    print(f"Features created: {len(df):,} rows")
    print(f"Saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()