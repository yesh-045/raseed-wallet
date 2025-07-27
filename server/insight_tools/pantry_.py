"""
Pantry Management & Food Waste Analysis - Minimized  
"""
from utils import get_db, fetch_user_receipts, parse_timestamp, safe_float, generate_ai_insight
from collections import defaultdict
from datetime import datetime, timedelta

def analyze_pantry_patterns(user_id):
    """Analyze food purchasing patterns and predict waste"""
    receipts = list(fetch_user_receipts(user_id, 90))  # 3 months
    
    # Food inventory tracking
    food_inventory = defaultdict(lambda: {
        "quantity": 0, 
        "last_bought": None, 
        "total_spent": 0, 
        "purchase_count": 0,
        "category": ""
    })
    
    waste_risk_items = []
    
    # Food category shelf life mapping (days)
    SHELF_LIVES = {
        "dairy": 7, "milk": 7, "cheese": 14,
        "meat": 3, "chicken": 2, "beef": 3, "fish": 2,
        "vegetables": 7, "fruits": 5, "berries": 3,
        "bread": 5, "bakery": 3,
        "pantry": 365, "canned": 730, "dry goods": 365,
        "frozen": 90, "ice cream": 60,
        "snacks": 180, "chips": 60
    }
    
    # Food-related keywords for categorization
    food_keywords = {
        "dairy": ["milk", "cheese", "yogurt", "butter", "cream"],
        "meat": ["chicken", "beef", "pork", "fish", "salmon", "turkey"],
        "vegetables": ["carrot", "broccoli", "spinach", "lettuce", "tomato", "onion"],
        "fruits": ["apple", "banana", "orange", "berries", "grapes"],
        "bread": ["bread", "bagel", "muffin", "rolls"],
        "snacks": ["chips", "crackers", "cookies", "candy"]
    }
    
    for receipt_doc in receipts:
        try:
            receipt = receipt_doc.to_dict() if hasattr(receipt_doc, 'to_dict') else receipt_doc
            if not receipt:
                continue
            
            timestamp = parse_timestamp(receipt.get("timestamp"))
            if not timestamp:
                continue
            
            store_name = receipt.get("store_name", "").lower()
            
            # Focus on grocery stores
            grocery_indicators = ["market", "grocery", "food", "fresh", "super", "whole foods", "trader joe"]
            is_grocery = any(indicator in store_name for indicator in grocery_indicators)
            
            for item in receipt.get("items", []):
                if not isinstance(item, dict):
                    continue
                
                item_name = item.get("item_name", "").lower()
                category = item.get("category", "").lower()
                quantity = safe_float(item.get("quantity", 1))
                price = safe_float(item.get("unit_price", 0)) * quantity
                
                if not item_name or price <= 0:
                    continue
                
                # Categorize food items
                food_category = "other"
                if category in SHELF_LIVES:
                    food_category = category
                else:
                    # Check item name against food keywords
                    for cat, keywords in food_keywords.items():
                        if any(keyword in item_name for keyword in keywords):
                            food_category = cat
                            break
                
                # Only analyze food items from grocery stores
                if is_grocery or food_category != "other":
                    # Update inventory
                    food_inventory[item_name]["quantity"] += quantity
                    food_inventory[item_name]["last_bought"] = timestamp
                    food_inventory[item_name]["total_spent"] += price
                    food_inventory[item_name]["purchase_count"] += 1
                    food_inventory[item_name]["category"] = food_category
                    
                    # Calculate waste risk
                    shelf_life = SHELF_LIVES.get(food_category, 30)
                    days_since_purchase = (datetime.now() - timestamp).days
                    
                    # High waste risk criteria
                    waste_risk = "low"
                    if days_since_purchase > shelf_life * 0.8:  # 80% of shelf life passed
                        waste_risk = "high"
                    elif days_since_purchase > shelf_life * 0.5:  # 50% of shelf life passed
                        waste_risk = "medium"
                    
                    # Additional risk factors
                    if food_inventory[item_name]["purchase_count"] > 2:  # Bought multiple times
                        waste_risk = "high"
                    
                    if waste_risk in ["medium", "high"]:
                        waste_risk_items.append({
                            "item": item_name,
                            "category": food_category,
                            "waste_risk": waste_risk,
                            "days_since_purchase": days_since_purchase,
                            "shelf_life": shelf_life,
                            "amount_spent": price,
                            "total_spent": food_inventory[item_name]["total_spent"],
                            "purchase_frequency": food_inventory[item_name]["purchase_count"]
                        })
                    
        except Exception:
            continue
    
    # Analyze waste patterns by category
    waste_by_category = defaultdict(lambda: {"items": 0, "value": 0})
    for item in waste_risk_items:
        if item["waste_risk"] == "high":
            waste_by_category[item["category"]]["items"] += 1
            waste_by_category[item["category"]]["value"] += item["total_spent"]
    
    # Calculate estimated monthly waste
    total_waste_value = sum(item["amount_spent"] for item in waste_risk_items if item["waste_risk"] == "high")
    estimated_monthly_waste = total_waste_value * (30 / 90)  # Extrapolate to monthly
    
    # Find frequent purchases (potential overstocking)
    frequent_purchases = []
    for item, data in food_inventory.items():
        if data["purchase_count"] >= 3:  # Bought 3+ times in 3 months
            frequent_purchases.append({
                "item": item,
                "category": data["category"],
                "purchase_count": data["purchase_count"],
                "total_spent": round(data["total_spent"], 2),
                "avg_purchase_interval": 90 / data["purchase_count"]  # Days between purchases
            })
    
    # Sort by waste risk and value
    waste_risk_items.sort(key=lambda x: (x["waste_risk"] == "high", x["total_spent"]), reverse=True)
    frequent_purchases.sort(key=lambda x: x["purchase_count"], reverse=True)
    
    # Generate recommendations
    recommendations = []
    if total_waste_value > 20:
        recommendations.append(f"💰 Reduce food waste to save ${estimated_monthly_waste:.2f}/month")
    
    if waste_by_category:
        top_waste_category = max(waste_by_category.items(), key=lambda x: x[1]["value"])
        recommendations.append(f"🥗 Focus on {top_waste_category[0]} - highest waste category")
    
    if frequent_purchases:
        top_frequent = frequent_purchases[0]
        recommendations.append(f"📦 Consider buying {top_frequent['item']} less frequently")
    
    # Suggest meal planning
    if len(waste_risk_items) > 5:
        recommendations.append("📋 Consider meal planning to reduce food waste")
    
    try:
        ai_insight = generate_ai_insight(
            "Analyze food waste patterns and suggest pantry management strategies:",
            {
                "waste_risk_items": waste_risk_items[:5],
                "frequent_purchases": frequent_purchases[:3],
                "waste_by_category": dict(waste_by_category)
            }
        )
        recommendations.append(ai_insight)
    except:
        pass
    
    return {
        "type": "pantry_analysis",
        "user_id": user_id,
        "waste_risk_items": waste_risk_items[:10],
        "frequent_purchases": frequent_purchases[:10],
        "waste_by_category": [
            {"category": cat, "items": data["items"], "value": round(data["value"], 2)}
            for cat, data in waste_by_category.items()
        ],
        "estimated_monthly_waste": round(estimated_monthly_waste, 2),
        "total_food_spending": round(sum(data["total_spent"] for data in food_inventory.values()), 2),
        "recommendations": recommendations
    }

if __name__ == "__main__":
    result = analyze_pantry_patterns("user001")
    print(result)
