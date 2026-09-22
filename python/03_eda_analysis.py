from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt


BASE_DIR = Path(__file__).resolve().parent.parent
INPUT_FILE = BASE_DIR / "data" / "processed" / "cleaned_food_delivery.csv"
OUTPUT_DIR = BASE_DIR / "outputs" / "charts"
KPI_FILE = BASE_DIR / "outputs" / "eda_kpis.csv"


def main():
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Dataset not found: {INPUT_FILE}")

    df = pd.read_csv(INPUT_FILE, parse_dates=["order_date"])

    required = {
        "order_id", "order_amount", "delivery_time",
        "customer_rating", "city", "cuisine",
        "order_date", "delivery_category"
    }

    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns: {sorted(missing)}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    total_orders = df["order_id"].nunique()
    total_revenue = df["order_amount"].sum()
    average_order_value = df["order_amount"].mean()
    average_delivery_time = df["delivery_time"].mean()
    average_rating = df["customer_rating"].mean()

    monthly = (
        df.assign(month=df["order_date"].dt.to_period("M"))
        .groupby("month")["order_amount"]
        .sum()
    )

    city = df.groupby("city")["order_amount"].sum().nlargest(10)
    cuisine = df.groupby("cuisine")["order_amount"].sum().nlargest(10)

    delivery = (
        df.groupby("delivery_category", observed=True)["customer_rating"]
        .mean()
        .dropna()
    )

    plt.figure(figsize=(10, 5))
    monthly.plot(marker="o")
    plt.title("Monthly Revenue")
    plt.xlabel("Month")
    plt.ylabel("Revenue")
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "monthly_revenue.png", dpi=150)
    plt.close()

    plt.figure(figsize=(10, 5))
    city.sort_values().plot(kind="barh")
    plt.title("Top 10 Cities by Revenue")
    plt.xlabel("Revenue")
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "city_revenue.png", dpi=150)
    plt.close()

    plt.figure(figsize=(10, 5))
    cuisine.sort_values().plot(kind="barh")
    plt.title("Top 10 Cuisines by Revenue")
    plt.xlabel("Revenue")
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "cuisine_revenue.png", dpi=150)
    plt.close()

    plt.figure(figsize=(8, 5))
    delivery.plot(kind="bar")
    plt.title("Average Rating by Delivery Category")
    plt.xlabel("Delivery Category")
    plt.ylabel("Average Rating")
    plt.xticks(rotation=0)
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "delivery_rating.png", dpi=150)
    plt.close()

    kpis = pd.DataFrame({
        "Metric": [
            "Total Orders",
            "Total Revenue",
            "Average Order Value",
            "Average Delivery Time",
            "Average Customer Rating"
        ],
        "Value": [
            total_orders,
            total_revenue,
            average_order_value,
            average_delivery_time,
            average_rating
        ]
    })

    kpis.to_csv(KPI_FILE, index=False)

    print(f"Total orders: {total_orders:,}")
    print(f"Total revenue: {total_revenue:,.2f}")
    print(f"Average order value: {average_order_value:,.2f}")
    print(f"Average delivery time: {average_delivery_time:.2f}")
    print(f"Average rating: {average_rating:.2f}")
    print("EDA completed successfully.")


if __name__ == "__main__":
    main()