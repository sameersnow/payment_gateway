# Copyright (c) 2025, Xettle and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
import tigerbeetle as tb
from iswitch.tigerbeetle_client import get_client


class Merchant(Document):
    def on_update(self):
        # Run only if status changed
        if not self.has_value_changed("status"):
            return

        remark = self.get("remark")

        title = "Account Status Updated"
        message = f"Your merchant account status has been updated to: {self.status}"
        priority = "info"

        if self.status == "Approved":
            title = "Account Activated ✅"
            message = (
                "Congratulations! Your merchant account has been activated. "
                "You can now start processing transactions."
            )

        elif self.status == "Rejected":
            title = "Account Rejected ❌"
            message = "Your merchant account has been rejected."
            if remark:
                message += f"\n\nReason: {remark}"
            message += (
                "\n\nPlease contact support or resubmit your application "
                "with the required changes."
            )
            priority = "urgent"

        elif self.status == "Suspended":
            title = "Account Suspended ⚠️"
            message = "Your merchant account has been suspended."
            if remark:
                message += f"\n\nReason: {remark}"
            priority = "warning"

        elif self.status == "Submitted":
            title = "Account Under Review 📋"
            message = (
                "Your merchant account is now under review. "
                "We will notify you once the review is complete."
            )

        elif self.status == "Terminated":
            title = "Account Terminated ⛔"
            message = (
                "Your merchant account has been permanently terminated. "
                "Access to your account has been revoked."
            )
            if remark:
                message += f"\n\nReason: {remark}"
            priority = "urgent"

        # Create Notification Log
        frappe.get_doc({
            "doctype": "Notification Log",
            "subject": title,
            "email_content": message,
            "for_user": self.owner,
            "type": "Alert",
            "document_type": "Merchant",
            "document_name": self.name
        }).insert(ignore_permissions=True)

        # Realtime notification
        frappe.publish_realtime(
            event="merchant_notification",
            message={
                "title": title,
                "message": message,
                "priority": priority,
                "timestamp": frappe.utils.now()
            },
            user=self.owner
        )

    def after_insert(self):
        self._create_tigerbeetle_account()

    def _create_tigerbeetle_account(self):
        client = get_client()

        account_id = tb.id()

        main_account = tb.Account(
            id=account_id,
            debits_pending=0,
            debits_posted=0,
            credits_pending=0,
            credits_posted=0,
            user_data_128=0,
            user_data_64=0,
            user_data_32=0,
            ledger=1,
            code=100,
            flags=tb.AccountFlags.DEBITS_MUST_NOT_EXCEED_CREDITS,
            timestamp=0,
        )

        lien_id = tb.id()

        lien_account = tb.Account(
            id=lien_id,
            debits_pending=0,
            debits_posted=0,
            credits_pending=0,
            credits_posted=0,
            user_data_128=0,
            user_data_64=0,
            user_data_32=0,
            ledger=1,
            code=200,
            flags=tb.AccountFlags.DEBITS_MUST_NOT_EXCEED_CREDITS,
            timestamp=0,
        )

        errors = client.create_accounts([main_account, lien_account])

        if errors:
            error = errors[0]

            # If account somehow already exists, ignore safely
            if error.result == tb.CreateAccountResult.EXISTS:
                frappe.log_error("TigerBeetle account already exists")
            else:
                frappe.throw(f"TigerBeetle account creation failed: {error.result}")

        # Save TB account id in merchant
        self.db_set("tigerbeetle_id", str(main_account.id))
        self.db_set("lien_tigerbeetle_id", str(lien_account.id))