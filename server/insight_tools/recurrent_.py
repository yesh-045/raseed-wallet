"""
Recurring Purchase Pattern Analysis - Minimized
"""
from utils import get_db, fetch_user_receipts, parse_timestamp, safe_float, generate_ai_insight
from collections import defaultdict
from datetime import datetime, timedelta

def analyze_purchase_patterns(user_id):
    """Analyze recurring purchase patterns and subscription detection"""
    receipts = list(fetch_user_receipts(user_id, 180))  # 6 months
    
    # Track purchase patterns
    vendor_patterns = defaultdict(list)
    item_frequencies = defaultdict(list)
    monthly_spending = defaultdict(float)
    
    for receipt_doc in receipts:
        try:
            receipt = receipt_doc.to_dict() if hasattr(receipt_doc, 'to_dict') else receipt_doc
            if not receipt:
                continue
            
            timestamp = parse_timestamp(receipt.get("timestamp"))
            if not timestamp:
                continue
            
            month_key = timestamp.strftime("%Y-%m")
            store_name = receipt.get("store_name", "").lower()
            total_amount = safe_float(receipt.get("total_amount", 0))
            
            if total_amount > 0:
                monthly_spending[month_key] += total_amount
                vendor_patterns[store_name].append({
                    "date": timestamp,
                    "amount": total_amount,
                    "month": month_key
                })
            
            # Track item frequency
            for item in receipt.get("items", []):
                if not isinstance(item, dict):
                    continue
                
                item_name = item.get("item_name", "").lower()
                if item_name:
                    item_frequencies[item_name].append({
                        "date": timestamp,
                        "price": safe_float(item.get("unit_price", 0)),
                        "quantity": safe_float(item.get("quantity", 1))
                    })
                    
        except Exception:
            continue
    
    # Detect recurring patterns
    recurring_vendors = []
    recurring_items = []
    subscription_candidates = []
    
    # Analyze vendor patterns
    for vendor, purchases in vendor_patterns.items():
        if len(purchases) >= 3:  # At least 3 purchases
            dates = [p["date"] for p in purchases]
            amounts = [p["amount"] for p in purchases]
            
            # Calculate average interval between purchases
            if len(dates) > 1:
                intervals = []
                sorted_dates = sorted(dates)
                for i in range(1, len(sorted_dates)):
                    interval = (sorted_dates[i] - sorted_dates[i-1]).days
                    intervals.append(interval)
                
                avg_interval = sum(intervals) / len(intervals) if intervals else 0
                
                # Check for subscription-like patterns (consistent monthly charges)
                if 25 <= avg_interval <= 35:  # Monthly pattern
                    amount_variance = max(amounts) - min(amounts)
                    if amount_variance < 5:  # Consistent amount
                        subscription_candidates.append({
                            "vendor": vendor,
                            "avg_amount": round(sum(amounts) / len(amounts), 2),
                            "frequency": "monthly",
                            "confidence": "high" if amount_variance < 2 else "medium",
                            "last_purchase": max(dates).strftime("%Y-%m-%d")
                        })
                
                recurring_vendors.append({
                    "vendor": vendor,
                    "purchase_count": len(purchases),
                    "avg_interval_days": round(avg_interval, 1),
                    "total_spent": round(sum(amounts), 2),
                    "avg_amount": round(sum(amounts) / len(amounts), 2)
                })
    
    # Analyze item frequency patterns
    for item, purchases in item_frequencies.items():
        if len(purchases) >= 4:  # Frequently bought items
            total_quantity = sum(p["quantity"] for p in purchases)
            avg_price = sum(p["price"] for p in purchases if p["price"] > 0) / len([p for p in purchases if p["price"] > 0])
            
            recurring_items.append({
                "item": item,
                "purchase_count": len(purchases),
                "total_quantity": round(total_quantity, 1),
                "avg_price": round(avg_price, 2) if avg_price > 0 else 0,
                "total_spent": round(sum(p["price"] * p["quantity"] for p in purchases), 2)
            })
    
    # Sort by relevance
    recurring_vendors.sort(key=lambda x: x["total_spent"], reverse=True)
    recurring_items.sort(key=lambda x: x["total_spent"], reverse=True)
    subscription_candidates.sort(key=lambda x: x["avg_amount"], reverse=True)
    
    # Generate insights
    insights = []
    total_subscription_cost = sum(s["avg_amount"] for s in subscription_candidates)
    
    if subscription_candidates:
        insights.append(f"💳 {len(subscription_candidates)} potential subscriptions detected (${total_subscription_cost:.2f}/month)")
    
    if recurring_vendors:
        top_vendor = recurring_vendors[0]
        insights.append(f"🏪 Most frequent: {top_vendor['vendor']} - ${top_vendor['total_spent']} over {top_vendor['purchase_count']} visits")
    
    # Monthly spending trend
    if len(monthly_spending) >= 3:
        months = sorted(monthly_spending.keys())
        recent_avg = sum(monthly_spending[m] for m in months[-3:]) / 3
        older_avg = sum(monthly_spending[m] for m in months[:-3]) / max(1, len(months) - 3)
        
        if recent_avg > older_avg * 1.1:
            insights.append(f"📈 Spending increased: ${recent_avg:.2f}/month (up {((recent_avg/older_avg-1)*100):.1f}%)")
        elif recent_avg < older_avg * 0.9:
            insights.append(f"📉 Spending decreased: ${recent_avg:.2f}/month (down {((1-recent_avg/older_avg)*100):.1f}%)")
    
    try:
        ai_insight = generate_ai_insight(
            "Analyze recurring purchase patterns and suggest optimizations:",
            {
                "subscriptions": subscription_candidates,
                "top_vendors": recurring_vendors[:3],
                "frequent_items": recurring_items[:5]
            }
        )
        insights.append(ai_insight)
    except:
        pass
    
    return {
        "type": "recurring_patterns",
        "user_id": user_id,
        "recurring_vendors": recurring_vendors[:10],
        "recurring_items": recurring_items[:15],
        "subscription_candidates": subscription_candidates,
        "monthly_spending_trend": dict(monthly_spending),
        "insights": insights
    }

if __name__ == "__main__":
    result = analyze_purchase_patterns("user001")
    print(result)
