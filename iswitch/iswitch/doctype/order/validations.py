import frappe

def validate_order_business_rules(doc, user=None, ip_address=None):
    try:
        merchant = frappe.get_doc("Merchant", doc.owner)

        if merchant.status != "Approved":
            frappe.throw(
                f"Your Account is in {merchant.status} stage. Please contact Admin"
            )

        if not merchant.integration:
            frappe.throw(
                "Processor isn't configured yet to process your order."
            )

        product = frappe.db.exists(
            "Product",
            {"product_name": doc.mode.upper(), "is_active": 1}
        )
        if not product:
            frappe.throw(
                f"{doc.mode} payment mode is currently unavailable"
            )

        order_amount = float(doc.amount)

        product_pricing = frappe.db.sql("""
            SELECT name FROM `tabProduct Pricing`
            WHERE parent=%s AND product=%s
            AND %s BETWEEN start_value AND end_value
        """, (merchant.name, doc.mode.upper(), order_amount), as_dict=True)

        if not product_pricing:
            frappe.throw(
                "This payment mode or transaction limit is not active for you"
            )

    except Exception as e:
        frappe.throw(str(e))