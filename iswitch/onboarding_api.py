"""
Onboarding API
Handles merchant onboarding process for the React portal
"""

import frappe
from frappe import _
import json


@frappe.whitelist()
def get_onboarding_status():
	"""
	Get current merchant's onboarding status and progress
	"""
	if frappe.session.user == "Guest":
		frappe.throw(_("Not logged in"), frappe.PermissionError)
	
	user = frappe.get_doc("User", frappe.session.user)
	
	# Get merchant
	merchant_doc = frappe.get_all(
		"Merchant",
		filters={"personal_email": user.email},
		fields=[
			"name", "onboarding_completed", "business_type", "company_name", 
			"industry", "description", "website", "country", "address_line_1", 
			"address_line_2", "city", "state", "postal_code", "phone", 
			"director_pan", "director_adhar", "company_pan", "company_gst"
		],
		limit=1
	)
	
	if not merchant_doc:
		frappe.throw(_("Merchant not found"), frappe.DoesNotExistError)
	
	merchant = merchant_doc[0]
	
	# Calculate completion status for each step
	# Note: Bank account step removed from required flow
	steps = {
		"business_type": bool(merchant.get("business_type")),
		"business_info": bool(merchant.get("company_name") and merchant.get("industry")),
		"address": bool(merchant.get("address_line_1") and merchant.get("city") and merchant.get("state") and merchant.get("postal_code") and merchant.get("phone")),
		"documents": 0  # Count uploaded documents
	}
	
	# Count documents (using actual Merchant fields)
	doc_count = 0
	for doc_field in ["director_pan", "director_adhar", "company_pan", "company_gst"]:
		if merchant.get(doc_field):
			doc_count += 1
	steps["documents"] = doc_count
	
	# Calculate current step (0-indexed)
	# 0: Business Type
	# 1: Business Info
	# 2: Address
	# 3: Documents
	# 4: Review
	current_step = 0
	if steps["business_type"]:
		current_step = 1
	if steps["business_info"]:
		current_step = 2
	if steps["address"]:
		current_step = 3
	if steps["documents"] >= 4:  # At least 2 documents required
		current_step = 4
	
	# Calculate completion percentage
	total_steps = 4 # Excludes review as a "work" step, or 5? Let's say 4 work steps.
	completed_steps = sum([
		1 if steps["business_type"] else 0,
		1 if steps["business_info"] else 0,
		1 if steps["address"] else 0,
		1 if steps["documents"] >= 4 else 0
	])
	completion_percentage = int((completed_steps / total_steps) * 100)
	
	# Construct data dictionary progressively
	data = {}
	
	# Step 0 Data (Business Type)
	# Always include Step 0 data if we are at least at Step 0 (which is always)
	data["business_type"] = merchant.get("business_type", "")
	
	# Step 1 Data (Business Info) - Include if at least at Step 1 or completed Step 0
	if current_step >= 1:
		data.update({
			"business_name": merchant.get("company_name", ""),
			"industry": merchant.get("industry", ""),
			"description": merchant.get("description", ""),
			"website": merchant.get("website", ""),
		})
		
	# Step 2 Data (Address) - Include if at least at Step 2
	if current_step >= 2:
		data.update({
			"country": merchant.get("country", ""),
			"address1": merchant.get("address_line_1", ""),
			"address2": merchant.get("address_line_2", ""),
			"city": merchant.get("city", ""),
			"state": merchant.get("state", ""),
			"postalCode": merchant.get("postal_code", ""),
			"phone": merchant.get("phone", ""),
		})
	
	response = {
		"merchant_id": merchant["name"],
		"onboarding_completed": merchant.get("onboarding_completed", 0),
		"current_step": current_step,
		"completion_percentage": completion_percentage,
		"steps": steps,
		"data": data
	}

	# Only include documents if we are at the documents step (3) or have completed it
	if current_step >= 3:
		response["documents"] = {
			"director_pan": merchant.get("director_pan", ""),
			"director_adhar": merchant.get("director_adhar", ""),
			"company_pan": merchant.get("company_pan", ""),
			"company_gst": merchant.get("company_gst", ""),
		}

	return response


@frappe.whitelist()
def update_business_type(business_type):
	"""
	Update business type (Step 0)
	"""
	if frappe.session.user == "Guest":
		frappe.throw(_("Not logged in"), frappe.PermissionError)
	
	user = frappe.get_doc("User", frappe.session.user)
	
	merchant_doc = frappe.get_all(
		"Merchant",
		filters={"personal_email": user.email},
		fields=["name"],
		limit=1
	)
	
	if not merchant_doc:
		frappe.throw(_("Merchant not found"), frappe.DoesNotExistError)
	
	merchant = frappe.get_doc("Merchant", merchant_doc[0]["name"])
	merchant.business_type = business_type
	merchant.save(ignore_permissions=True)
	
	return {"success": True, "message": "Business type updated"}


@frappe.whitelist()
def update_business_info(business_name, industry, website="", description=""):
	"""
	Update merchant business information (Step 1)
	"""
	if frappe.session.user == "Guest":
		frappe.throw(_("Not logged in"), frappe.PermissionError)
	
	user = frappe.get_doc("User", frappe.session.user)
	
	merchant_doc = frappe.get_all(
		"Merchant",
		filters={"personal_email": user.email},
		fields=["name"],
		limit=1
	)
	
	if not merchant_doc:
		frappe.throw(_("Merchant not found"), frappe.DoesNotExistError)
	
	merchant = frappe.get_doc("Merchant", merchant_doc[0]["name"])
	merchant.company_name = business_name
	merchant.industry = industry
	merchant.website = website
	merchant.description = description
	merchant.save(ignore_permissions=True)
	
	return {"success": True, "message": "Business information updated"}


@frappe.whitelist()
def update_address(country, address1, address2, city, state, postal_code, phone):
	"""
	Update merchant address (Step 2)
	"""
	if frappe.session.user == "Guest":
		frappe.throw(_("Not logged in"), frappe.PermissionError)
	
	user = frappe.get_doc("User", frappe.session.user)
	
	merchant_doc = frappe.get_all(
		"Merchant",
		filters={"personal_email": user.email},
		fields=["name"],
		limit=1
	)
	
	if not merchant_doc:
		frappe.throw(_("Merchant not found"), frappe.DoesNotExistError)
	
	merchant = frappe.get_doc("Merchant", merchant_doc[0]["name"])
	merchant.country = country
	merchant.address_line_1 = address1
	merchant.address_line_2 = address2
	merchant.city = city
	merchant.state = state
	merchant.postal_code = postal_code
	merchant.phone = phone
	merchant.save(ignore_permissions=True)
	
	return {"success": True, "message": "Address updated"}


@frappe.whitelist()
def add_bank_account(bank_name, account_holder_name, account_number, routing_number, account_type="checking"):
	"""
	Add bank account (Step 3) - kept for backward compatibility but currently unused in main flow
	"""
	if frappe.session.user == "Guest":
		frappe.throw(_("Not logged in"), frappe.PermissionError)
	
	user = frappe.get_doc("User", frappe.session.user)
	
	merchant_doc = frappe.get_all(
		"Merchant",
		filters={"personal_email": user.email},
		fields=["name"],
		limit=1
	)
	
	if not merchant_doc:
		frappe.throw(_("Merchant not found"), frappe.DoesNotExistError)
	
	merchant = frappe.get_doc("Merchant", merchant_doc[0]["name"])
	
	# Clear existing bank accounts and add new one
	merchant.bank_accounts = []
	merchant.append("bank_accounts", {
		"bank_name": bank_name,
		"account_holder_name": account_holder_name,
		"account_number": account_number,
		"ifsc_code": routing_number,  # Using ifsc_code field for routing number
	})
	
	merchant.save(ignore_permissions=True)
	
	return {"success": True, "message": "Bank account added"}


@frappe.whitelist()
def upload_document():
	"""
	Upload onboarding documents
	Expects files in request.files with keys: director_pan, director_adhar, company_pan, company_gst
	Maps to existing Merchant DocType fields
	"""
	if frappe.session.user == "Guest":
		frappe.throw(_("Not logged in"), frappe.PermissionError)
	
	user = frappe.get_doc("User", frappe.session.user)
	
	# Get merchant by personal_email (consistent with other functions)
	merchant_doc = frappe.get_all(
		"Merchant",
		filters={"personal_email": user.email},
		fields=["name"],
		limit=1
	)
	
	if not merchant_doc:
		frappe.throw(_("Merchant not found"), frappe.DoesNotExistError)
	
	merchant = frappe.get_doc("Merchant", merchant_doc[0]["name"])
	
	# Map frontend field names to Merchant DocType fields
	# Frontend uses generic names, backend uses specific Indian document names
	field_mapping = {
		"director_pan": "director_pan",
		"director_adhar": "director_adhar",
		"company_pan": "company_pan",
		"company_gst": "company_gst"
	}
	
	# File upload settings
	MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
	ALLOWED_EXTENSIONS = (".pdf", ".png", ".jpg", ".jpeg")
	
	files_uploaded = []
	
	for frontend_field, merchant_field in field_mapping.items():
		file = frappe.request.files.get(frontend_field)
		if not file:
			continue
		
		# Validate file extension
		if not file.filename.lower().endswith(ALLOWED_EXTENSIONS):
			frappe.throw(_(f"Only PDF, JPG, PNG files are allowed for {frontend_field}"))
		
		# Validate file size
		file.seek(0, 2)
		size = file.tell()
		file.seek(0)
		
		if size > MAX_FILE_SIZE:
			frappe.throw(_(f"File size for {frontend_field} must be under 10MB"))
		
		# Save file using Frappe's save_file
		from frappe.utils.file_manager import save_file
		
		saved_file = save_file(
			fname=file.filename,
			content=file.stream.read(),
			dt="Merchant",
			dn=merchant.name,
			is_private=1  # Onboarding docs should be private
		)
		
		# Update merchant field with file URL
		merchant.set(merchant_field, saved_file.file_url)
		files_uploaded.append(frontend_field)
	
	if files_uploaded:
		merchant.save(ignore_permissions=True)
		frappe.db.commit()
		
		return {
			"success": True,
			"message": f"Uploaded {len(files_uploaded)} document(s) successfully",
			"files_uploaded": files_uploaded
		}
	
	return {"success": False, "message": "No files uploaded"}


@frappe.whitelist()
def complete_onboarding():
	"""
	Mark onboarding as completed and submit merchant for approval
	"""
	if frappe.session.user == "Guest":
		frappe.throw(_("Not logged in"), frappe.PermissionError)
	
	user = frappe.get_doc("User", frappe.session.user)
	
	merchant_doc = frappe.get_all(
		"Merchant",
		filters={"personal_email": user.email},
		fields=["name"],
		limit=1
	)
	
	if not merchant_doc:
		frappe.throw(_("Merchant not found"), frappe.DoesNotExistError)
	
	merchant = frappe.get_doc("Merchant", merchant_doc[0]["name"])
	
	# Verify all required fields are filled
	if not merchant.business_type:
		frappe.throw(_("Please select business type"))
	
	if not merchant.company_name or not merchant.industry:
		frappe.throw(_("Please complete business information"))
	
	if not merchant.address_line_1 or not merchant.city or not merchant.state or not merchant.postal_code or not merchant.phone:
		frappe.throw(_("Please complete address information"))
	
    # Bank Account check removed as per requirement
	
	# Check at least 2 documents uploaded (using actual Merchant fields)
	doc_count = 0
	for field in ["director_pan", "director_adhar", "company_pan", "company_gst"]:
		if getattr(merchant, field):
			doc_count += 1
	
	if doc_count < 2:
		frappe.throw(_("Please upload at least 2 documents"))
	
	# Mark onboarding as completed
	merchant.onboarding_completed = 1
	merchant.status = "Submitted"  # Change status to Submitted for review
	merchant.save(ignore_permissions=True)
	
	return {
		"success": True,
		"message": "Onboarding completed successfully! Your account is now pending approval."
	}