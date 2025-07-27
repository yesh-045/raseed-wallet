"""
Micro-Moment Spending Analysis - Minimized
Detects impulsive spend moments and spending triggers
"""
from utils import get_db, fetch_user_receipts, parse_timestamp, safe_float, generate_ai_insight
from collections import defaultdict
from datetime import datetime, timedelta

def analyze_micro_moments(user_id):
    """Analyze spending patterns to detect impulsive purchases and triggers"""
    receipts = list(fetch_user_receipts(user_id, 60))  # 2 months
    
    impulse_indicators = []
    time_patterns = defaultdict(list)
    vendor_frequency = defaultdict(int)
    amount_patterns = []
    
    for receipt_doc in receipts:
        try:
            receipt = receipt_doc.to_dict() if hasattr(receipt_doc, 'to_dict') else receipt_doc
            if not receipt:
                continue
            
            timestamp = parse_timestamp(receipt.get("timestamp"))
            if not timestamp:
                continue
            
            total_amount = safe_float(receipt.get("total_amount", 0))
            store_name = receipt.get("store_name", "").lower()
            
            if total_amount <= 0:
                continue
            
            # Track time patterns
            hour = timestamp.hour
            day_of_week = timestamp.weekday()
            time_patterns[f"{day_of_week}_{hour}"].append(total_amount)
            
            vendor_frequency[store_name] += 1
            amount_patterns.append({
                "amount": total_amount,
                "hour": hour,
                "day": day_of_week,
                "store": store_name,
                "date": timestamp
            })
            
            # Detect potential impulse purchases
            items = receipt.get("items", [])
            if len(items) <= 3 and total_amount > 20:  # Few items, significant amount
                impulse_indicators.append({
                    "amount": total_amount,
                    "items_count": len(items),
                    "store": store_name,
                    "time": timestamp.strftime("%Y-%m-%d %H:%M"),
                    "trigger": "few_items_high_value"
                })
            
            # Late night purchases (potential emotional spending)
            if hour >= 22 or hour <= 6:
                impulse_indicators.append({
                    "amount": total_amount,
                    "store": store_name,
                    "time": timestamp.strftime("%Y-%m-%d %H:%M"),
                    "trigger": "late_night_purchase"
                })
                
        except Exception:
            continue
    
    # Analyze patterns
    peak_spending_times = []
    for time_key, amounts in time_patterns.items():
        if len(amounts) >= 2:
            day, hour = time_key.split('_')
            avg_amount = sum(amounts) / len(amounts)
            peak_spending_times.append({
                "day_of_week": int(day),
                "hour": int(hour),
                "avg_amount": round(avg_amount, 2),
                "frequency": len(amounts),
                "day_name": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][int(day)]
            })
    
    # Sort by frequency and amount
    peak_spending_times.sort(key=lambda x: x["frequency"] * x["avg_amount"], reverse=True)
    
    # Identify high-frequency vendors (potential triggers)
    frequent_vendors = [
        {"vendor": vendor, "visit_count": count}
        for vendor, count in vendor_frequency.items()
        if count >= 3
    ]
    frequent_vendors.sort(key=lambda x: x["visit_count"], reverse=True)
    
    # Calculate spending velocity (purchases within short time frames)
    quick_succession_purchases = []
    sorted_amounts = sorted(amount_patterns, key=lambda x: x["date"])
    
    for i in range(1, len(sorted_amounts)):
        current = sorted_amounts[i]
        previous = sorted_amounts[i-1]
        time_diff = (current["date"] - previous["date"]).total_seconds() / 3600  # hours
        
        if time_diff <= 2 and current["amount"] + previous["amount"] > 50:  # Within 2 hours, significant total
            quick_succession_purchases.append({
                "first_amount": previous["amount"],
                "second_amount": current["amount"],
                "total": current["amount"] + previous["amount"],
                "time_gap_hours": round(time_diff, 1),
                "stores": [previous["store"], current["store"]]
            })
    
    # Generate insights
    insights = []
    total_impulse_spending = sum(ind["amount"] for ind in impulse_indicators)
    
    if impulse_indicators:
        insights.append(f"⚡ {len(impulse_indicators)} potential impulse purchases detected (${total_impulse_spending:.2f})")
    
    if peak_spending_times:
        top_time = peak_spending_times[0]
        insights.append(f"⏰ Peak spending: {top_time['day_name']}s at {top_time['hour']:02d}:00 (${top_time['avg_amount']:.2f} avg)")
    
    if frequent_vendors:
        top_vendor = frequent_vendors[0]
        insights.append(f"🎯 Trigger location: {top_vendor['vendor']} ({top_vendor['visit_count']} visits)")
    
    if quick_succession_purchases:
        total_quick = sum(p["total"] for p in quick_succession_purchases)
        insights.append(f"🔄 {len(quick_succession_purchases)} rapid purchase sequences (${total_quick:.2f} total)")
    
    try:
        ai_insight = generate_ai_insight(
            "Analyze spending triggers and suggest impulse control strategies:",
            {
                "impulse_indicators": impulse_indicators[-5:],  # Recent ones
                "peak_times": peak_spending_times[:3],
                "frequent_vendors": frequent_vendors[:3]
            }
        )
        insights.append(ai_insight)
    except:
        pass
    
    return {
        "type": "micro_moment_analysis",
        "user_id": user_id,
        "impulse_indicators": impulse_indicators,
        "peak_spending_times": peak_spending_times[:10],
        "frequent_trigger_vendors": frequent_vendors[:5],
        "quick_succession_purchases": quick_succession_purchases,
        "total_impulse_spending": round(total_impulse_spending, 2),
        "insights": insights
    }

if __name__ == "__main__":
    result = analyze_micro_moments("user001")
    print(result)