import * as React from "react";
import { Feedback } from "@/lib/firebase/schema";

interface FeedbackNotificationProps {
  feedback: Feedback;
}

export default function FeedbackNotification({
  feedback,
}: FeedbackNotificationProps) {
  return (
    <div>
      <h1>New Feedback Submitted</h1>
      <p>
        A new {feedback.type} has been submitted by {feedback.name} (
        {feedback.userEmail}).
      </p>
      <div style={{ marginTop: "20px", marginBottom: "20px" }}>
        <h2>Feedback Details</h2>
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
                Type
              </td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                {feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)}
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
                Subject
              </td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                {feedback.subject}
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
                Message
              </td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                {feedback.body}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: "20px" }}>
        <p>
          <a
            href={`${process.env.NEXT_PUBLIC_APP_URL}/admin/feedback`}
            style={{
              display: "inline-block",
              backgroundColor: "#4f46e5",
              color: "white",
              fontWeight: "bold",
              padding: "12px 20px",
              borderRadius: "6px",
              textDecoration: "none",
            }}
          >
            View in Admin Panel
          </a>
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
