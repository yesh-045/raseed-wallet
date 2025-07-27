"""
Advanced Spending Overlap & Duplicate Subscription Detection
"""
from utils import get_db, fetch_user_receipts, parse_timestamp, safe_float, generate_ai_insight
from collections import defaultdict, Counter
from datetime import datetime, timedelta
import statistics

def detect_spending_overlaps(user_id):
    """Advanced overlapping spending and subscription detection with detailed analysis"""
    receipts = list(fetch_user_receipts(user_id, 120))  # 4 months of data
    
    if not receipts:
        return {
            "type": "overlap_analysis",
            "user_id": user_id,
            "subscription_candidates": [],
            "overlapping_services": [],
            "category_overlaps": [],
            "total_potential_savings": 0.0,
            "insights": ["No transaction data available for overlap analysis"],
            "insight_summary": "Insufficient data for overlap analysis"
        }
    
    # Advanced data structures for comprehensive analysis
    vendor_transactions = defaultdict(list)
    category_vendors = defaultdict(list)
    subscription_patterns = defaultdict(list)
    service_categories = defaultdict(set)
    monthly_spending = defaultdict(lambda: defaultdict(float))
    
    # Enhanced service categorization with intelligent matching
    service_mapping = {
        # Streaming & Entertainment
        'streaming': {
            'keywords': ['netflix', 'hulu', 'disney', 'disney+', 'prime video', 'amazon prime', 
                        'spotify', 'apple music', 'youtube', 'peacock', 'paramount', 'hbo', 'max'],
            'category': 'entertainment',
            'avg_cost_range': (5.99, 19.99)
        },
        # Fitness & Health
        'fitness': {
            'keywords': ['gym', 'fitness', 'planet fitness', 'la fitness', 'anytime fitness', 
                        'peloton', 'yoga', 'pilates', 'crossfit', 'lifetime'],
            'category': 'fitness',
            'avg_cost_range': (9.99, 89.99)
        },
        # Food & Delivery
        'food_delivery': {
            'keywords': ['doordash', 'uber eats', 'grubhub', 'postmates', 'instacart', 
                        'food delivery', 'delivery'],
            'category': 'food',
            'avg_cost_range': (15.00, 50.00)
        },
        # Cloud Storage
        'cloud_storage': {
            'keywords': ['dropbox', 'google drive', 'icloud', 'onedrive', 'box', 'storage'],
            'category': 'utilities',
            'avg_cost_range': (0.99, 19.99)
        },
        # Retail Shopping
        'retail': {
            'keywords': ['amazon', 'walmart', 'target', 'costco', 'best buy', 'home depot'],
            'category': 'shopping',
            'avg_cost_range': (20.00, 200.00)
        },
        # Coffee Shops
        'coffee': {
            'keywords': ['starbucks', 'dunkin', 'coffee', 'cafe', 'espresso'],
            'category': 'food',
            'avg_cost_range': (3.00, 8.00)
        }
    }
    
    print(f"Processing {len(receipts)} receipts for overlap analysis...")
    
    # Process all receipts with enhanced data extraction
    for receipt_doc in receipts:
        try:
            receipt = receipt_doc.to_dict() if hasattr(receipt_doc, 'to_dict') else receipt_doc
            if not receipt:
                continue
            
            timestamp = parse_timestamp(receipt.get("timestamp") or receipt.get("date"))
            if not timestamp:
                continue
            
            # Extract vendor information with multiple fallbacks
            vendor = (receipt.get("vendor") or receipt.get("store") or 
                     receipt.get("store_name") or "").lower().strip()
            
            # Extract amount with multiple fallbacks
            amount = safe_float(receipt.get("total_amount") or receipt.get("amount", 0))
            
            if not vendor or amount <= 0:
                continue
            
            # Clean vendor name for better matching
            vendor_clean = vendor.replace("'", "").replace("-", " ").replace("_", " ")
            
            month_key = timestamp.strftime("%Y-%m")
            category = receipt.get("category", "other").lower()
            
            # Store transaction data
            transaction_data = {
                "date": timestamp,
                "amount": amount,
                "month": month_key,
                "category": category,
                "receipt_id": receipt.get("receipt_id", ""),
                "raw_vendor": vendor
            }
            
            vendor_transactions[vendor_clean].append(transaction_data)
            category_vendors[category].append({
                "vendor": vendor_clean,
                "amount": amount,
                "date": timestamp
            })
            monthly_spending[month_key][vendor_clean] += amount
            
            # Categorize services using intelligent matching
            for service_type, service_info in service_mapping.items():
                for keyword in service_info['keywords']:
                    if keyword in vendor_clean:
                        service_categories[service_type].add(vendor_clean)
                        break
                        
        except Exception as e:
            print(f"Error processing receipt: {e}")
            continue
    
    print(f"Processed {len(vendor_transactions)} unique vendors")
    
    # ADVANCED SUBSCRIPTION DETECTION
    subscription_candidates = []
    
    for vendor, transactions in vendor_transactions.items():
        if len(transactions) < 2:  # Need at least 2 transactions
            continue
        
        # Sort transactions by date
        transactions.sort(key=lambda x: x["date"])
        amounts = [t["amount"] for t in transactions]
        dates = [t["date"] for t in transactions]
        
        # Calculate statistical measures
        avg_amount = statistics.mean(amounts)
        amount_variance = statistics.stdev(amounts) if len(amounts) > 1 else 0
        variance_coefficient = amount_variance / avg_amount if avg_amount > 0 else 1
        
        # Calculate time intervals
        intervals = []
        for i in range(1, len(dates)):
            interval_days = (dates[i] - dates[i-1]).days
            intervals.append(interval_days)
        
        if not intervals:
            continue
        
        avg_interval = statistics.mean(intervals)
        interval_variance = statistics.stdev(intervals) if len(intervals) > 1 else 0
        
        # Enhanced subscription detection logic
        is_subscription = False
        frequency_type = "irregular"
        confidence = "low"
        
        # Check for consistent amounts (subscription-like)
        if variance_coefficient < 0.15:  # Less than 15% variance
            # Check for regular intervals
            if 28 <= avg_interval <= 32 and interval_variance < 5:  # Monthly
                is_subscription = True
                frequency_type = "monthly"
                confidence = "high"
            elif 6 <= avg_interval <= 8 and interval_variance < 2:  # Weekly
                is_subscription = True
                frequency_type = "weekly"
                confidence = "high"
            elif 13 <= avg_interval <= 15 and interval_variance < 3:  # Bi-weekly
                is_subscription = True
                frequency_type = "bi-weekly"
                confidence = "medium"
            elif 85 <= avg_interval <= 95:  # Quarterly
                is_subscription = True
                frequency_type = "quarterly"
                confidence = "medium"
        
        # Also detect semi-regular patterns (medium confidence)
        elif variance_coefficient < 0.3 and len(transactions) >= 3:
            if 20 <= avg_interval <= 40:  # Roughly monthly
                is_subscription = True
                frequency_type = "monthly"
                confidence = "medium"
        
        if is_subscription:
            # Calculate additional metrics
            total_annual_cost = avg_amount * (365 / avg_interval)
            last_transaction = max(dates)
            months_active = (last_transaction - min(dates)).days / 30.44
            
            subscription_candidates.append({
                "vendor": vendor,
                "avg_amount": round(avg_amount, 2),
                "frequency": frequency_type,
                "confidence": confidence,
                "purchase_count": len(transactions),
                "last_charge": last_transaction.strftime("%Y-%m-%d"),
                "amount_variance": round(amount_variance, 2),
                "annual_cost": round(total_annual_cost, 2),
                "months_active": round(months_active, 1),
                "avg_interval_days": round(avg_interval, 1),
                "consistency_score": round((1 - variance_coefficient) * 100, 1)
            })
    
    print(f"Found {len(subscription_candidates)} subscription candidates")
    
    # ADVANCED OVERLAPPING SERVICES DETECTION
    overlapping_services = []
    
    for service_type, vendors in service_categories.items():
        if len(vendors) >= 2:  # Multiple vendors in same service category
            service_info = service_mapping[service_type]
            vendor_details = []
            total_monthly_cost = 0
            
            for vendor in vendors:
                if vendor in vendor_transactions:
                    transactions = vendor_transactions[vendor]
                    avg_amount = statistics.mean([t["amount"] for t in transactions])
                    monthly_frequency = len(transactions) / 4  # 4 months of data
                    monthly_cost = avg_amount * monthly_frequency
                    
                    vendor_details.append({
                        "vendor": vendor,
                        "avg_amount": round(avg_amount, 2),
                        "monthly_cost": round(monthly_cost, 2),
                        "transaction_count": len(transactions),
                        "frequency_per_month": round(monthly_frequency, 1)
                    })
                    total_monthly_cost += monthly_cost
            
            if vendor_details:
                # Calculate potential savings (assumes consolidation to best option)
                vendor_details.sort(key=lambda x: x["monthly_cost"])
                cheapest_cost = vendor_details[0]["monthly_cost"]
                potential_savings = max(0, total_monthly_cost - cheapest_cost)
                
                # Generate smart recommendations
                if service_type == 'streaming':
                    recommendation = f"Consider keeping only {vendor_details[0]['vendor']} and canceling other streaming services"
                elif service_type == 'fitness':
                    recommendation = f"Consolidate to one gym membership. {vendor_details[0]['vendor']} appears most cost-effective"
                elif service_type == 'coffee':
                    recommendation = f"Reduce coffee shop visits or stick to {vendor_details[0]['vendor']} for better value"
                elif service_type == 'food_delivery':
                    recommendation = f"Limit to one delivery service or cook more at home to save ${potential_savings:.2f}/month"
                else:
                    recommendation = f"Consolidate {service_type} services to reduce redundancy"
                
                overlapping_services.append({
                    "category": service_type.replace('_', ' ').title(),
                    "services": vendor_details,
                    "total_monthly_cost": round(total_monthly_cost, 2),
                    "potential_savings": round(potential_savings, 2),
                    "recommendation": recommendation,
                    "overlap_severity": "high" if len(vendors) >= 3 else "medium"
                })
    
    # CATEGORY-BASED OVERLAP ANALYSIS
    category_overlaps = []
    
    for category, vendor_data in category_vendors.items():
        if len(vendor_data) < 5:  # Skip categories with too few transactions
            continue
        
        # Group by vendor
        vendor_spending = defaultdict(float)
        vendor_frequency = defaultdict(int)
        
        for item in vendor_data:
            vendor_spending[item["vendor"]] += item["amount"]
            vendor_frequency[item["vendor"]] += 1
        
        # Only analyze if there are multiple vendors
        if len(vendor_spending) >= 2:
            total_category_spending = sum(vendor_spending.values())
            vendor_list = []
            
            for vendor, total_spent in vendor_spending.items():
                vendor_list.append({
                    "vendor": vendor,
                    "total_spent": round(total_spent, 2),
                    "frequency": vendor_frequency[vendor],
                    "percentage": round((total_spent / total_category_spending) * 100, 1)
                })
            
            # Sort by spending amount
            vendor_list.sort(key=lambda x: x["total_spent"], reverse=True)
            
            # Calculate potential savings from consolidation
            top_vendor_spending = vendor_list[0]["total_spent"]
            potential_savings = total_category_spending * 0.15  # Assume 15% savings from consolidation
            
            category_overlaps.append({
                "category": category.title(),
                "vendor_count": len(vendor_spending),
                "total_spending": round(total_category_spending, 2),
                "vendors": vendor_list[:5],  # Top 5 vendors
                "potential_savings": round(potential_savings, 2),
                "recommendation": f"Focus {category} spending on top 1-2 vendors for better deals and loyalty benefits"
            })
    
    # Calculate total potential savings
    total_potential_savings = (
        sum(service["potential_savings"] for service in overlapping_services) +
        sum(overlap["potential_savings"] for overlap in category_overlaps)
    )
    
    # GENERATE COMPREHENSIVE INSIGHTS
    insights = []
    
    if subscription_candidates:
        high_confidence_subs = [s for s in subscription_candidates if s["confidence"] == "high"]
        total_subscription_cost = sum(s["annual_cost"] for s in subscription_candidates)
        insights.append(f"💳 {len(subscription_candidates)} subscriptions detected (${total_subscription_cost:.0f}/year)")
        if high_confidence_subs:
            insights.append(f"🎯 {len(high_confidence_subs)} high-confidence recurring payments identified")
    
    if overlapping_services:
        insights.append(f"⚠️ {len(overlapping_services)} overlapping service categories found")
        highest_overlap = max(overlapping_services, key=lambda x: x["potential_savings"])
        insights.append(f"🏆 Biggest opportunity: {highest_overlap['category']} (${highest_overlap['potential_savings']:.2f}/month savings)")
    
    if category_overlaps:
        most_fragmented = max(category_overlaps, key=lambda x: x["vendor_count"])
        insights.append(f"🛍️ Most fragmented spending: {most_fragmented['category']} across {most_fragmented['vendor_count']} vendors")
    
    if total_potential_savings > 0:
        annual_savings = total_potential_savings * 12
        insights.append(f"💰 Total potential savings: ${total_potential_savings:.2f}/month (${annual_savings:.2f}/year)")
    
    # Generate AI-powered detailed insight
    try:
        ai_context = {
            "total_subscriptions": len(subscription_candidates),
            "overlapping_categories": len(overlapping_services),
            "monthly_savings": total_potential_savings,
            "top_overlaps": overlapping_services[:3],
            "subscription_costs": [s["annual_cost"] for s in subscription_candidates[:5]]
        }
        
        ai_prompt = f"""Analyze spending overlaps for financial optimization:
        
        Subscriptions: {len(subscription_candidates)} detected
        Overlapping services: {len(overlapping_services)} categories
        Potential monthly savings: ${total_potential_savings:.2f}
        
        Provide 3-4 specific, actionable recommendations for reducing overlap and optimizing subscriptions.
        Focus on the highest-impact changes for maximum savings."""
        
        ai_insight = generate_ai_insight(ai_prompt, ai_context)
        if ai_insight and ai_insight.strip():
            insights.append(ai_insight)
    except Exception as e:
        print(f"AI insight generation failed: {e}")
    
    # Create comprehensive summary
    if total_potential_savings > 0:
        summary = f"Found ${total_potential_savings:.2f}/month in potential savings from {len(overlapping_services)} overlapping services and {len(subscription_candidates)} subscriptions. Consolidating services could save ${total_potential_savings * 12:.0f} annually."
    else:
        summary = f"Analyzed {len(vendor_transactions)} vendors across {len(receipts)} transactions. No significant overlaps detected, but found {len(subscription_candidates)} subscription patterns."
    
    return {
        "type": "overlap_analysis",
        "user_id": user_id,
        "subscription_candidates": sorted(subscription_candidates, key=lambda x: x["annual_cost"], reverse=True),
        "overlapping_services": sorted(overlapping_services, key=lambda x: x["potential_savings"], reverse=True),
        "category_overlaps": sorted(category_overlaps, key=lambda x: x["total_spending"], reverse=True),
        "total_potential_savings": round(total_potential_savings, 2),
        "insights": insights,
        "insight_summary": summary,
        "analysis_metadata": {
            "receipts_analyzed": len(receipts),
            "unique_vendors": len(vendor_transactions),
            "analysis_period_months": 4,
            "generated_at": datetime.now().isoformat()
        }
    }
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        user_id = sys.argv[1]
    else:
        user_id = "tnBEe1cweQWBnc6HzFMve3hSUke2"
    
    result = detect_spending_overlaps(user_id)
    
    print(f"\nOverlap Analysis Results for {user_id}:")
    print(f"- Subscription candidates: {len(result['subscription_candidates'])}")
    print(f"- Overlapping services: {len(result['overlapping_services'])}")
    print(f"- Total potential savings: ${result['total_potential_savings']}")
    
    if result['subscription_candidates']:
        print("\nTop Subscriptions:")
        for sub in result['subscription_candidates'][:3]:
            print(f"  • {sub['vendor']}: ${sub['avg_amount']} ({sub['frequency']}, {sub['confidence']} confidence)")
    
    if result['overlapping_services']:
        print("\nTop Overlapping Services:")
        for service in result['overlapping_services'][:3]:
            print(f"  • {service['category']}: ${service['potential_savings']}/month savings potential")
