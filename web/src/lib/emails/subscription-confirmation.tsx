import * as React from "react";
import { BillingCycle, PlanType } from "@/stores/subscriptionStore";

interface SubscriptionConfirmationProps {
  name: string;
  planType: PlanType;
  price: number;
  billingCycle: BillingCycle;
}

export default function SubscriptionConfirmation({
  name,
  planType,
  price,
  billingCycle,
}: SubscriptionConfirmationProps) {
  return (
    <div>
      <h1>Welcome to LaunchpadAI, {name}!</h1>
      <p>
        Thank you for subscribing to LaunchpadAI. Your subscription has been
        successfully activated.
      </p>
      <div style={{ marginTop: "20px", marginBottom: "20px" }}>
        <h2>Subscription Details</h2>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "10px",
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  padding: "8px",
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                }}
              >
                Plan
              </td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                {planType}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "8px",
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                }}
              >
                Billing Cycle
              </td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                {billingCycle === "annual" ? "Annual" : "Monthly"}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "8px",
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                }}
              >
                Amount
              </td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                ${price}/{billingCycle === "annual" ? "year" : "month"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        You now have access to all features included in the {planType} plan.
        We're excited to have you on board!
      </p>
      <div style={{ marginTop: "20px" }}>
        <p>
          If you have any questions or need assistance, please contact us at:
        </p>
        <p>
          <a href="mailto:support@launchpadai.com">support@launchpadai.com</a>
        </p>
      </div>
      <hr style={{ marginTop: "40px", marginBottom: "20px" }} />
      <div style={{ fontSize: "12px", color: "#666" }}>
        <p>
          &copy; {new Date().getFullYear()} LaunchpadAI. All rights reserved.
        </p>
      </div>
    </div>
  );
}
