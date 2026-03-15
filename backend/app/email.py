import os
import logging
import resend

logger = logging.getLogger(__name__)

SALES_EMAIL = os.environ.get("SALES_EMAIL", "boulara@me.com")
resend.api_key = os.environ.get("RESEND_API_KEY", "")

PRIORITY_LABELS = {"urgent": "🔴 URGENT", "high": "🟡 HIGH", "normal": "Normal"}


def send_sales_notification(notification, patient):
    """Send an email to the Sales team when they receive a notification."""
    if not resend.api_key:
        logger.warning("RESEND_API_KEY not set — skipping email")
        return

    priority_label = PRIORITY_LABELS.get(notification.priority, notification.priority)
    prescriber     = patient.prescriber if patient else "Unknown"
    patient_id     = patient.id if patient else "N/A"
    territory      = patient.territory if patient else "—"
    region         = patient.region if patient else "—"
    payer          = patient.primary_payer if patient else "—"
    program        = patient.program_type if patient else "—"
    aging          = patient.aging_of_status if patient else "—"

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
      <div style="background: #1a2744; border-radius: 10px; padding: 20px 24px; margin-bottom: 20px;">
        <div style="color: #4f8ef7; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 6px;">AAIM Portal</div>
        <div style="color: #ffffff; font-size: 22px; font-weight: 700;">New Sales Notification</div>
        <div style="color: rgba(255,255,255,0.6); font-size: 13px; margin-top: 4px;">From: {notification.from_team} · {notification.from_user}</div>
      </div>

      <div style="background: #fff; border-radius: 10px; padding: 20px 24px; margin-bottom: 16px; border: 1px solid #e5e7eb;">
        <div style="font-size: 11px; letter-spacing: 2px; color: #9ca3af; text-transform: uppercase; margin-bottom: 4px;">Priority</div>
        <div style="font-size: 16px; font-weight: 700; color: {'#e74c3c' if notification.priority == 'urgent' else '#f0a500' if notification.priority == 'high' else '#374151'};">{priority_label}</div>
      </div>

      <div style="background: #fff; border-radius: 10px; padding: 20px 24px; margin-bottom: 16px; border: 1px solid #e5e7eb;">
        <div style="font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #f3f4f6;">Patient Information</div>
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr><td style="padding: 5px 0; color: #6b7280; width: 40%;">Patient ID</td><td style="color: #111827; font-weight: 600;">#{patient_id}</td></tr>
          <tr><td style="padding: 5px 0; color: #6b7280;">Prescriber</td><td style="color: #111827; font-weight: 600;">{prescriber}</td></tr>
          <tr><td style="padding: 5px 0; color: #6b7280;">Territory</td><td style="color: #111827;">{territory}</td></tr>
          <tr><td style="padding: 5px 0; color: #6b7280;">Region</td><td style="color: #111827;">{region}</td></tr>
          <tr><td style="padding: 5px 0; color: #6b7280;">Primary Payer</td><td style="color: #111827;">{payer}</td></tr>
          <tr><td style="padding: 5px 0; color: #6b7280;">Program Type</td><td style="color: #111827;">{program}</td></tr>
          <tr><td style="padding: 5px 0; color: #6b7280;">Case Aging</td><td style="color: #111827;">{aging} days</td></tr>
        </table>
      </div>

      <div style="background: #fff; border-radius: 10px; padding: 20px 24px; border: 1px solid #e5e7eb; border-left: 4px solid #4f8ef7;">
        <div style="font-size: 11px; letter-spacing: 2px; color: #9ca3af; text-transform: uppercase; margin-bottom: 8px;">Message</div>
        <div style="font-size: 14px; color: #374151; line-height: 1.6;">{notification.comment}</div>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af;">
        Log in to AAIM Portal to acknowledge or reply to this notification.
      </div>
    </div>
    """

    try:
        resend.Emails.send({
            "from":    "AAIM Portal <onboarding@resend.dev>",
            "to":      [SALES_EMAIL],
            "subject": f"[{priority_label}] New Notification — {prescriber} ({territory})",
            "html":    html,
        })
        logger.info("Sales email sent to %s for patient %s", SALES_EMAIL, patient_id)
    except Exception as e:
        logger.error("Failed to send sales email: %s", e)
