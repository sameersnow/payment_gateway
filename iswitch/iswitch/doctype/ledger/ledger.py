# Copyright (c) 2025, Xettle and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class Ledger(Document):
	def before_insert(self):
		self.owner = self.merchant
	pass
