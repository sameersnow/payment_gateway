"""
Portal Authentication API
Unified authentication endpoints for the React portal
"""

import frappe
from frappe import _
import tigerbeetle as tb
from iswitch.tigerbeetle_client import get_client


@frappe.whitelist(allow_guest=True)
def get_user_context():
	"""
	Get current user context including role and merchant information
	"""
	app_name = frappe.db.get_single_value("Website Settings", "app_name") or "iSwitch"
	app_logo = frappe.db.get_single_value("Website Settings", "banner_image")

	if frappe.session.user == "Guest":
		return {
			"user": None,
			"app_name": app_name,
			"app_logo": app_logo
		}

	user = frappe.get_doc("User", frappe.session.user)
	roles = frappe.get_roles(frappe.session.user)

	# Check if user is a merchant
	merchant = None
	if "Merchant" in roles:
		from iswitch.merchant_team_helper import get_logged_in_merchant_id, get_current_user_role

						
		# This will return the merchant ID for both Owner and Team Members
		merchant_id = get_logged_in_merchant_id()

		if merchant_id:
			# Auto-activate Pending Team Member
			pending_member = frappe.db.get_value("Merchant Team", {"user": user.email, "status": "Pending", "parent": merchant_id}, "name")
			if pending_member:
				frappe.db.set_value("Merchant Team", pending_member, "status", "Active")
				frappe.db.commit()

			merchant_doc = frappe.get_all(
				"Merchant",
				filters={"name": merchant_id},
				fields=["name", "company_name", "status", "onboarding_completed", "logo"],
				limit=1
			)
			
			if merchant_doc:
				merchant_name = merchant_doc[0]["name"]
				
				# # Get wallet balance
				# wallet = frappe.get_all(
				# 	"Wallet",
				# 	filters={"merchant_id": merchant_name},
				# 	fields=["balance"],
				# 	limit=1
				# )
				# Get TigerBeetle balance
				merchant_doc_full = frappe.get_doc("Merchant", merchant_name)

				balance = 0

				if merchant_doc_full.tigerbeetle_id:
					client = get_client()
					account_id = int(merchant_doc_full.tigerbeetle_id)

					accounts = client.lookup_accounts([account_id])

					if accounts:
						account = accounts[0]
						balance = (account.credits_posted - account.debits_posted - account.debits_pending) / 100
								
				merchant = {
					"name": merchant_name,
					"company_name": merchant_doc[0]["company_name"],
					"status": merchant_doc[0]["status"],
					"balance": balance,
					"onboarding_completed": merchant_doc[0].get("onboarding_completed", 0),
					"logo": merchant_doc[0].get("logo"),
					"role": get_current_user_role(merchant_name)
				}

	return {
		"user": {
			"name": user.name,
			"email": user.email,
			"full_name": user.full_name,
			"user_image": user.user_image,
			"roles": roles
		},
		"merchant": merchant,
        "app_name": app_name,
        "app_logo": app_logo
	}


@frappe.whitelist(allow_guest=True)
def signup(email, password, full_name, company_name):
	"""
	Create new merchant account
	"""
	# Validate inputs
	if not email or not password or not full_name or not company_name:
		frappe.throw(_("All fields are required"))
	
	# Check if user already exists
	if frappe.db.exists("User", email):
		frappe.throw(_("User with this email already exists"))

	# Check password strength
	from frappe.core.doctype.user.user import test_password_strength
	
	first_name = full_name.split()[0] if full_name else "User"
	last_name = " ".join(full_name.split()[1:]) if full_name and len(full_name.split()) > 1 else ""
	
	# user_data format: (first_name, middle_name, last_name, email, birth_date)
	user_data = (first_name, "", last_name, email, None)
	
	strength_result = test_password_strength(password, user_data=user_data)
	
	# If policy is enabled and validation failed
	if strength_result and not strength_result.get("feedback", {}).get("password_policy_validation_passed", True):
		feedback = strength_result.get("feedback", {})
		suggestions = feedback.get("suggestions", [])
		warning = feedback.get("warning", "")
		
		msg = _("Password is too weak.")
		if warning:
			msg += " " + _(warning)
		if suggestions:
			msg += " " + " ".join([_(s) for s in suggestions])
			
		frappe.throw(msg, frappe.exceptions.ValidationError)

	# Create User
	try:
		user = frappe.get_doc({
			"doctype": "User",
			"email": email,
			"first_name": full_name.split()[0] if full_name else "User",
			"full_name": full_name,
			"send_welcome_email": 0,
			"enabled": 1
		})
		user.insert(ignore_permissions=True)
		
		# Set password
		user.new_password = password

		# Add Merchant role
		user.add_roles("Merchant")
		
		user.save(ignore_permissions=True)

	except frappe.exceptions.ValidationError as e:
		# Check if it's a password strength error
		if "Password must contain" in str(e):
			frappe.clear_messages()
			frappe.throw(_("Password is too weak. It must differ from your name/email and contain mixed case, numbers, and special characters."))
		
		# Re-throw other validation errors
		raise e
	except Exception as e:
		frappe.log_error("Signup Error")
		raise e


	frappe.set_user(user.name)
	# Create Merchant document
	merchant = frappe.get_doc({
		"doctype": "Merchant",
		"personal_email": email,
		"personal_name": full_name,
		"company_name": company_name,
		"company_email": email,
		"status": "Draft",
		"onboarding_completed": 0
	})
	merchant.insert(ignore_permissions=True)
	
	# TigerBeetle accounts are created automatically in Merchant.after_insert()
	
	frappe.db.commit()
	
	return {
		"success": True,
		"message": "Account created successfully! Please login to continue.",
		"user_email": email
	}


@frappe.whitelist(allow_guest=True)
def check_session():
	"""
	Check if user session is valid
	"""
	return {
		"logged_in": frappe.session.user != "Guest",
		"user": frappe.session.user
	}


@frappe.whitelist(allow_guest=True)
def get_website_settings():
    """
    Get website settings for public pages
    """
    return {
        "app_name": frappe.db.get_single_value("Website Settings", "app_name") or "iSwitch",
        "app_logo": frappe.db.get_single_value("Website Settings", "banner_image")
    }

