from pathlib import Path
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent.parent
RAW_FILE = BASE_DIR / "data" / "raw" / "food_delivery_data.csv"
OUTPUT_FILE = BASE_DIR / "data" / "processed" / "cleaned_food_delivery.csv"

REQUIRED = {
    "order_id", "customer_id", "restaurant_name", "city", "cuisine",
    "order_date", "order_amount", "delivery_fee", "discount",
    "delivery_time", "customer_rating", "payment_method", "order_status"
}

ALIASES = {
    "order id": "order_id",
    "customer id": "customer_id",
    "restaurant name": "restaurant_name",
    "order date": "order_date",
    "order value": "order_amount",
    "order amount": "order_amount",
    "delivery fee": "delivery_fee",
    "delivery time": "delivery_time",
    "customer rating": "customer_rating",
    "payment method": "payment_method",
    "order status": "order_status"
}


def main():
    if not RAW_FILE.exists():
        raise FileNotFoundError(f"Dataset not found: {RAW_FILE}")

    df = pd.read_csv(RAW_FILE)

    df.columns = [
        ALIASES.get(
            str(col).strip().lower().replace("_", " ").replace("-", " "),
            str(col).strip().lower().replace(" ", "_")
        )
        for col in df.columns
    ]

    missing = REQUIRED - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns: {sorted(missing)}")

    df = df.drop_duplicates().copy()

    for col in ["order_id", "customer_id"]:
        df[col] = df[col].astype("string").str.strip()

    numeric = [
        "order_amount",
        "delivery_fee",
        "discount",
        "delivery_time",
        "customer_rating"
    ]

    for col in numeric:
        df[col] = pd.to_numeric(df[col], errors="coerce")
        df[col] = df[col].fillna(df[col].median())

    categorical = [
        "restaurant_name",
        "city",
        "cuisine",
        "payment_method",
        "order_status"
    ]

    for col in categorical:
        df[col] = df[col].astype("string").str.strip()
        mode = df[col].mode(dropna=True)
        if not mode.empty:
            df[col] = df[col].fillna(mode.iloc[0])

    df["order_date"] = pd.to_datetime(
        df["order_date"],
        errors="coerce"
    )

    if df["order_date"].isna().any():
        raise ValueError("Invalid order_date values found.")

    if df[["order_id", "customer_id"]].isna().any().any():
        raise ValueError("Missing ID values found.")

    if (df[["order_amount", "delivery_fee", "discount", "delivery_time"]] < 0).any().any():
        raise ValueError("Negative numeric values found.")

    if (~df["customer_rating"].between(0, 5)).any():
        raise ValueError("customer_rating must be between 0 and 5.")

    if df["order_id"].duplicated().any():
        raise ValueError("Duplicate order_id values found.")

    if df.isna().any().any():
        raise ValueError("Missing values remain after cleaning.")

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_FILE, index=False)

    print(f"Cleaned dataset: {len(df):,} rows")
    print(f"Saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()