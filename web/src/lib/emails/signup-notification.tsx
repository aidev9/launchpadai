import * as React from "react";

interface SignupNotificationProps {
  name: string;
  email: string;
  subscription?: string;
  company?: string;
  role?: string;
  signupPath: string;
}

export default function SignupNotification({
  name,
  email,
  subscription = "free",
  company = "Not provided",
  role = "Not provided",
  signupPath,
}: SignupNotificationProps) {
  const date = new Date().toLocaleString();

  return (
    <div>
      <h1>Congratulations! A new user has signed up to LaunchpadAI</h1>
      <p>A new user has just signed up to LaunchpadAI at {date}.</p>
      <div style={{ marginTop: "20px", marginBottom: "20px" }}>
        <h2>User Details</h2>
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
                Name
              </td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                {name}
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
                Email
              </td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                {email}
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
                Subscription
              </td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                {subscription}
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
                Company
              </td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                {company}
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
                Role
              </td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                {role}
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
                Signup Method
              </td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                {signupPath}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>Login to the admin dashboard to view more details.</p>
      <div style={{ marginTop: "20px" }}>
        <p>This is an automated email notification.</p>
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
