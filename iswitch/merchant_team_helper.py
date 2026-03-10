import frappe
# --------------------------------------------------------------------------------
# Helper: Get Logged-in Merchant ID (Supports Owner & Team Members via Merchant Team)
# --------------------------------------------------------------------------------
def get_logged_in_merchant_id():
    """
    Returns the merchant ID (name) for the currently logged-in user.
    Checks:
      1. Is the user the 'personal_email' (Owner) of a Merchant?
      2. Is the user listed in the 'Merchant Team' child table (Team Member)?
    """
    user = frappe.session.user
    if user == 'Guest':
        return None
        
    # Check if Owner
    merchant_id = frappe.db.get_value("Merchant", {"personal_email": user})
    if not merchant_id:
        # Try case-insensitive lookup
        merchant_id = frappe.db.sql("""
            SELECT name FROM `tabMerchant` 
            WHERE LOWER(personal_email) = LOWER(%s)
        """, (user,), as_dict=True)
        if merchant_id:
            merchant_id = merchant_id[0]['name']
            
    if merchant_id:
        return merchant_id
        
    # Check if Team Member
    # Merchant Team is child table. We query 'tabMerchant Team'. 
    # Usually parent field links to the main doc.
    team_member = frappe.db.get_value("Merchant Team", {"user": user, "status": ["!=", "Disabled"]}, "parent")
    if team_member:
        return team_member
        
    return None

def get_current_user_role(merchant_id):
    """
    Returns the role of the logged-in user for the given merchant.
    """
    user = frappe.session.user
    
    # Check if Owner
    owner_email = frappe.db.get_value("Merchant", merchant_id, "personal_email")
    if owner_email and owner_email.lower() == user.lower():
        return "Owner"
        
    # Check Team Role
    role = frappe.db.get_value("Merchant Team", {"parent": merchant_id, "user": user}, "role")
    return role or "Viewer" # Default safely
