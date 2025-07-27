
from utils import get_db, get_ai_model, fetch_user_receipts, parse_timestamp, safe_float, generate_ai_insight
from collections import defaultdict

def analyze_spending_classification(user_id, months_back=6):
    """Analyze essential vs non-essential spending patterns"""
    receipts = list(fetch_user_receipts(user_id, months_back * 30))
    
    monthly_data = defaultdict(lambda: {
        "essential": 0.0, "non_essential": 0.0, "total": 0.0, "count": 0,
        "categories": defaultdict(float)
    })
    
    for receipt_doc in receipts:
        try:
            receipt = receipt_doc.to_dict() if hasattr(receipt_doc, 'to_dict') else receipt_doc
            if not receipt:
                continue
            
            timestamp = parse_timestamp(receipt.get("timestamp"))
            month = timestamp.strftime("%B %Y") if timestamp else "Unknown"
            
            total_amount = safe_float(receipt.get("total_amount", 0))
            if total_amount <= 0:
                continue
            
            # Get classification from Gemini inference
            gemini_data = receipt.get("gemini_inference", {})
            split = gemini_data.get("need_vs_want_split", {})
            
            essential_pct = safe_float(split.get("essential", 50))
            non_essential_pct = safe_float(split.get("non_essential", 50))
            
            # Calculate amounts
            essential_amount = (essential_pct / 100) * total_amount
            non_essential_amount = (non_essential_pct / 100) * total_amount
            
            # Update monthly data
            monthly_data[month]["essential"] += essential_amount
            monthly_data[month]["non_essential"] += non_essential_amount
            monthly_data[month]["total"] += total_amount
            monthly_data[month]["count"] += 1
            
            # Category breakdown
            for category, amount in gemini_data.get("category_spend", {}).items():
                monthly_data[month]["categories"][category] += safe_float(amount)
                
        except Exception:
            continue
    
    # Convert to list format
    monthly_breakdown = []
    for month, data in monthly_data.items():
        if data["total"] > 0:
            monthly_breakdown.append({
                "month": month,
                "essential_amount": round(data["essential"], 2),
                "non_essential_amount": round(data["non_essential"], 2),
                "total_amount": round(data["total"], 2),
                "essential_percentage": round((data["essential"] / data["total"]) * 100, 1),
                "receipt_count": data["count"],
                "top_categories": sorted(data["categories"].items(), key=lambda x: x[1], reverse=True)[:3]
            })
    
    # Generate insights
    total_essential = sum(m["essential_amount"] for m in monthly_breakdown)
    total_non_essential = sum(m["non_essential_amount"] for m in monthly_breakdown)
    total_spend = total_essential + total_non_essential
    
    insights = []
    if total_spend > 0:
        essential_ratio = (total_essential / total_spend) * 100
        
        if essential_ratio > 80:
            insights.append("✅ Excellent focus on essential spending")
        elif essential_ratio > 60:
            insights.append("👍 Good balance between needs and wants")
        elif essential_ratio > 40:
            insights.append("⚠️ Consider reducing non-essential purchases")
        else:
            insights.append("🚨 High non-essential spending detected")
        
        # AI-generated insights
        try:
            ai_insight = generate_ai_insight(
                "Analyze spending patterns and provide actionable advice:",
                f"Essential: ${total_essential:.2f} ({essential_ratio:.1f}%), Non-essential: ${total_non_essential:.2f} ({100-essential_ratio:.1f}%)"
            )
            insights.append(ai_insight)
        except:
            pass
    
    return {
        "type": "need_vs_want_analysis",
        "user_id": user_id,
        "summary": {
            "total_essential": total_essential,
            "total_non_essential": total_non_essential,
            "essential_percentage": round((total_essential / total_spend) * 100, 1) if total_spend > 0 else 0
        },
        # Frontend-compatible format
        "essential_spending": round(total_essential, 2),
        "discretionary_spending": round(total_non_essential, 2),
        "breakdown": {
            "essential": round((total_essential / total_spend) * 100, 1) if total_spend > 0 else 0,
            "discretionary": round((total_non_essential / total_spend) * 100, 1) if total_spend > 0 else 0
        },
        "monthly_breakdown": monthly_breakdown,
        "insights": insights
    }

if __name__ == "__main__":
    result = analyze_spending_classification("user001")
    print(result)