# Copyright (c) 2025, Xettle and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Integration(Document):
	def validate(self):
		if self.default:
			# Unset default for all other integrations
			frappe.db.sql("""
				UPDATE `tabIntegration`
				SET `default` = 0
				WHERE name != %s
			""", (self.name or "new",))

			# Reset all Approved merchants to use the new default (by clearing specific integration)
			frappe.db.sql("""
				UPDATE `tabMerchant`
				SET integration = %s
				WHERE status = 'Approved'
			""", (self.name or "",))
