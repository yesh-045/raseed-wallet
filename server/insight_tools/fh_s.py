
import sys
import os
# Add current directory to path to import utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from utils import get_db, get_ai_model, fetch_user_receipts, parse_timestamp, safe_float, generate_ai_insight
from collections import defaultdict, Counter
import statistics

# Score weights
WEIGHTS = {"savings": 30, "essentials_ratio": 20, "price_sensitivity": 15, "budget_adherence": 20, "category_balance": 15}

def analyze_spending_patterns(receipts):
    """Analyze spending patterns efficiently"""
    patterns = {
        "total_receipts": 0, "overspending_frequency": 0, "categories": defaultdict(float),
        "essential_vs_nonessential": {"essential": 0, "non_essential": 0},
        "above_market_items": 0, "total_items": 0, "monthly_trends": defaultdict(float)
    }
    
    for r in receipts:
        try:
            receipt = r.to_dict() if hasattr(r, 'to_dict') else r
            if not receipt:
                continue
                
            patterns["total_receipts"] += 1
            
            if receipt.get("overspent", False):
                patterns["overspending_frequency"] += 1
            
            # Monthly trends - use 'amount' field from mock data
            timestamp = parse_timestamp(receipt.get("date") or receipt.get("timestamp"))
            amount = safe_float(receipt.get("amount") or receipt.get("total_amount", 0))
            
            if timestamp and amount > 0:
                month = timestamp.strftime("%B %Y")
                patterns["monthly_trends"][month] += amount
                
                # Categorize spending based on category field
                category = receipt.get("category", "other")
                patterns["categories"][category] += amount
                
                # Essential vs non-essential based on category
                essential_categories = {"grocery", "utilities", "health", "gas", "transport"}
                if category in essential_categories:
                    patterns["essential_vs_nonessential"]["essential"] += amount
                else:
                    patterns["essential_vs_nonessential"]["non_essential"] += amount
            
            # Fallback to gemini data if available
            gemini_data = receipt.get("gemini_inference", {})
            if isinstance(gemini_data, dict):
                # Category spending
                for cat, gemini_amount in gemini_data.get("category_spend", {}).items():
                    patterns["categories"][cat] += safe_float(gemini_amount)
                
                # Essential vs non-essential
                split = gemini_data.get("need_vs_want_split", {})
                if isinstance(split, dict):
                    total_amount = safe_float(receipt.get("total_amount", 0))
                    essential_pct = safe_float(split.get("essential", 0))
                    non_essential_pct = safe_float(split.get("non_essential", 0))
                    
                    patterns["essential_vs_nonessential"]["essential"] += (essential_pct / 100) * total_amount
                    patterns["essential_vs_nonessential"]["non_essential"] += (non_essential_pct / 100) * total_amount
            
            # Item analysis
            for item in receipt.get("items", []):
                if isinstance(item, dict):
                    patterns["total_items"] += 1
                    if item.get("above_market_price", False):
                        patterns["above_market_items"] += 1
        except:
            continue
    
    return patterns

def generate_ai_suggestions(spending_patterns, user_data):
    """Generate AI-powered suggestions efficiently"""
    try:
        total_non_essential = spending_patterns["essential_vs_nonessential"]["non_essential"]
        total_essential = spending_patterns["essential_vs_nonessential"]["essential"]
        total_spend = total_non_essential + total_essential
        
        prompt = f"""Generate 2-3 specific financial tips for:
        Total: ${total_spend:.2f}, Essential: ${total_essential:.2f}, Non-essential: ${total_non_essential:.2f}
        Overspending rate: {(spending_patterns['overspending_frequency']/spending_patterns['total_receipts']*100 if spending_patterns['total_receipts'] > 0 else 0):.1f}%
        Above market purchases: {spending_patterns['above_market_items']} items
        Top categories: {list(spending_patterns['categories'].keys())[:3]}
        
        Provide actionable, specific recommendations as bullet points."""
        
        return generate_ai_insight(prompt, spending_patterns)
    except:
        return ["Focus on reducing non-essential spending", "Compare prices before purchasing", "Set monthly category budgets"]

def compute_fhs(user_data, receipts):
    """Compute Financial Health Score efficiently"""
    receipt_list = list(receipts) if not isinstance(receipts, list) else receipts
    spending_patterns = analyze_spending_patterns(receipt_list)
    
    # Get user data safely
    budget = safe_float(user_data.get("budget_monthly", 0))
    savings_pct = safe_float(user_data.get("savings_pct", 0))
    price_sensitivity = safe_float(user_data.get("price_sensitivity_score", 0.5))

    # Calculate scores
    savings_score = min(max(0, savings_pct), 30)
    
    # Essentials score
    total_tracked = spending_patterns["essential_vs_nonessential"]["essential"] + spending_patterns["essential_vs_nonessential"]["non_essential"]
    essential_ratio = spending_patterns["essential_vs_nonessential"]["essential"] / total_tracked if total_tracked > 0 else 0.5
    essentials_score = round(essential_ratio * WEIGHTS["essentials_ratio"])
    
    # Price sensitivity score
    price_score = round((1 - max(0, min(1, price_sensitivity))) * WEIGHTS["price_sensitivity"])
    
    # Budget adherence
    monthly_values = list(spending_patterns["monthly_trends"].values())
    avg_monthly = sum(monthly_values) / len(monthly_values) if monthly_values else 0
    if budget <= 0:
        adherence_score = round(0.5 * WEIGHTS["budget_adherence"])
    elif avg_monthly <= budget:
        adherence_score = WEIGHTS["budget_adherence"]
    else:
        over_pct = min((avg_monthly - budget) / budget, 1)
        adherence_score = round(WEIGHTS["budget_adherence"] * (1 - over_pct))
    
    # Category balance
    category_values = [v for v in spending_patterns["categories"].values() if v > 0]
    if len(category_values) <= 1:
        balance_score = round(0.5 * WEIGHTS["category_balance"])
    else:
        try:
            stdev = statistics.stdev(category_values)
            mean_spend = statistics.mean(category_values)
            imbalance = min(stdev / mean_spend, 1) if mean_spend > 0 else 0
            balance_score = round(WEIGHTS["category_balance"] * (1 - imbalance))
        except:
            balance_score = round(0.5 * WEIGHTS["category_balance"])
    
    final_fhs = max(0, min(100, savings_score + essentials_score + price_score + adherence_score + balance_score))
    
    return {
        "fhs_score": final_fhs,
        "breakdown": {
            "savings_score": savings_score,
            "essentials_score": essentials_score, 
            "price_score": price_score,
            "budget_adherence_score": adherence_score,
            "category_balance_score": balance_score
        },
        "suggestions": generate_ai_suggestions(spending_patterns, user_data),
        "spending_patterns": spending_patterns
    }

def compute_and_update_fhs(user_id):
    """Main function to compute and update FHS"""
    db = get_db()
    
    user_doc = db.db.collection("users").document(user_id).get()
    if not user_doc.exists:
        return {"error": "User not found"}

    user_data = user_doc.to_dict()
    receipts = list(fetch_user_receipts(user_id))
    result = compute_fhs(user_data, receipts)

    # Update if changed
    if abs(user_data.get("fhs_score", 0) - result["fhs_score"]) >= 1:
        db.db.collection("users").document(user_id).update({"fhs_score": result["fhs_score"]})

    patterns = result["spending_patterns"]
    overspend_rate = (patterns["overspending_frequency"] / patterns["total_receipts"] * 100) if patterns["total_receipts"] > 0 else 0
    
    # Calculate additional metrics for enhanced display
    total_spending = sum(patterns["categories"].values())
    essential_total = patterns["essential_vs_nonessential"]["essential"]
    essential_ratio = (essential_total / total_spending * 100) if total_spending > 0 else 0
    avg_transaction = total_spending / patterns["total_receipts"] if patterns["total_receipts"] > 0 else 0
    
    # Determine category based on FHS score
    fhs_score = result["fhs_score"]
    if fhs_score >= 80:
        category = "Excellent"
    elif fhs_score >= 70:
        category = "Good"
    elif fhs_score >= 60:
        category = "Fair"
    elif fhs_score >= 40:
        category = "Poor"
    else:
        category = "Critical"
    
    # Generate health indicators
    health_indicators = []
    
    if essential_ratio >= 70:
        health_indicators.append({"status": "good", "message": "✅ Good focus on essential spending"})
    elif essential_ratio >= 50:
        health_indicators.append({"status": "warning", "message": "⚠️ Moderate essential spending ratio"})
    else:
        health_indicators.append({"status": "error", "message": "❌ Low essential spending ratio"})
    
    if overspend_rate <= 10:
        health_indicators.append({"status": "good", "message": "✅ Low overspending frequency"})
    elif overspend_rate <= 25:
        health_indicators.append({"status": "warning", "message": "⚠️ Moderate overspending frequency"})
    else:
        health_indicators.append({"status": "error", "message": "❌ High overspending frequency"})
    
    if patterns["total_receipts"] >= 10:
        health_indicators.append({"status": "good", "message": "✅ Sufficient transaction data"})
    else:
        health_indicators.append({"status": "warning", "message": "⚠️ Limited transaction data"})
    
    if avg_transaction <= 1000:
        health_indicators.append({"status": "good", "message": "✅ Reasonable transaction amounts"})
    else:
        health_indicators.append({"status": "warning", "message": "⚠️ High average transaction amount"})
    
    return {
        "type": "fhs_analysis",
        "user_id": user_id,
        "fhs_score": result["fhs_score"],
        "score": result["fhs_score"],  # For compatibility
        "category": category,
        "breakdown": {
            "savings": result["breakdown"]["savings_score"],
            "essentials": result["breakdown"]["essentials_score"], 
            "price_sensitivity": result["breakdown"]["price_score"],
            "budget_adherence": result["breakdown"]["budget_adherence_score"],
            "category_balance": result["breakdown"]["category_balance_score"]
        },
        "total_spending": round(total_spending, 2),
        "essential_ratio": round(essential_ratio, 1),
        "avg_transaction": round(avg_transaction, 2),
        "health_indicators": health_indicators,
        "suggestions": result["suggestions"],
        "insight_summary": f"Your Financial Health Score is {result['fhs_score']}/100 ({category}), based on analysis of {patterns['total_receipts']} transactions with {overspend_rate:.1f}% overspending rate."
    }

if __name__ == "__main__":
    result = compute_and_update_fhs()
    print(result)