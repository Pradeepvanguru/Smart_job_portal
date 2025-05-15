const nodemailer = require("nodemailer");
const HR = require("../models/hrModel");
const multer = require("multer");
const path = require("path");

let isCancelled = false; // Flag to track if the process is cancelled

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage }).single("resume");

const sendEmails = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      console.error("Multer Error:", err);
      return res.status(500).json({ message: "File upload failed", error: err });
    }

    const { subject, template } = req.body;
    if (!subject || !template) {
      return res.status(400).json({ message: "Subject and template are required" });
    }

    const resumePath = req.file ? path.join(__dirname, "../uploads", req.file.filename) : null;

    try {
      const hrContacts = await HR.find();
      if (!hrContacts || hrContacts.length === 0) {
        return res.status(404).json({ message: "No HR contacts found" });
      }

      isCancelled = false; // Reset cancellation flag before starting

      const estimatedTime = hrContacts.length * 2; // Estimate 2 seconds per email
      res.json({ message: "Email sending started", estimatedTime }); // Send estimated time to frontend

      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      for (const hr of hrContacts) {
        if (isCancelled) {
          console.log("⛔ Process cancelled by user");
          res.json({ message: "Process cancelled" }); // Send response when cancelled
          return;
        }

        try {
          const personalizedTemplate = template
            .replace("[Recruiter's Name]", hr.name)
            .replace("[Company Name]", hr.company)
            .replace("[title]", hr.title);

          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: hr.email,
            subject,
            html: personalizedTemplate,
          //  html: `
          //     <div style="padding: 16px; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.8; color: #000000; text-align: left; border: 1px solid #ccc; border-radius: 8px; background-color: #ffffff;">
          //       <p style="font-size: 18px; font-weight: bold; color: #000000;">
          //         Hi ${hr.name} (${hr.title}),
          //       </p>
          //       <p>I hope you are doing well. My name is <b>Vanguru Pradeep</b>, and I am currently in my final year of B.Tech. I am seeking a software developer role where I can apply my expertise in:</p>
          //       <ul style="margin-left: 20px;">
          //         <li>Python, Java, Data Structures, OOPs, and Algorithms</li>
          //         <li>Web Design & Development (MERN Stack)</li>
          //       </ul>
          //       <p>
          //         As a motivated <b>Full-Stack Developer</b> with experience in the MERN stack, I have successfully contributed to projects including:
          //       </p>
          //       <ul style="margin-left: 20px;">
          //         <li><b>User authentication systems</b>, which verify user identities with login, registration, MFA, RBAC, and token-based security (JWT/OAuth)</li>
          //         <li>A <b>Workload Management and Substitution System</b> for faculties, which automates notifications and streamlines the substitution process</li>
          //         <li><b>Collaborative Workflow Management And Task Allocation</b> which is used to monitor the work of teammates in an organization.</li>
          //         <li><b>Smart Job Application System</b> which automates sending personalized emails with resumes to HR contacts for job opportunities.</li>
          //       </ul>
          //       <p>
          //         I am eager to bring my technical skills and problem-solving abilities to a dynamic organization like <b>${hr.company}</b>. I have attached my resume for your review and would appreciate the opportunity to discuss any available roles that align with my background.
          //       </p>
          //       <p>Looking forward to your response. Thank you for your time and consideration.</p>
          //       <p style="font-size: 20px; font-weight: bold; color: #000000;">Best Regards,</p>
          //       <p style="margin: 0; font-size: 20px; color: #000000;">Vanguru Pradeep</p>
          //       <p style="margin: 0; font-size: 14px; color: #000000;">📌 <a href="https://www.linkedin.com/in/vanguru-pradeep-79307725b" style="color: #000000; text-decoration: none;">LinkedIn Profile</a></p>
          //       <p style="margin: 0; font-size: 14px; color: #000000;">📞 7386385309</p>
          //       <p style="margin-top: 20px; font-size: 16px; font-weight: bold; color: #000000;">
          //         👇 Resume Attached
          //       </p>
          //     </div>
          //   `,
            attachments: resumePath ? [{ filename: req.file.originalname, path: resumePath }] : [],
          };

          await transporter.sendMail(mailOptions);
          console.log(`✅ Email sent successfully to ${hr.email}`);
        } catch (emailError) {
          console.error(`❌ Failed to send email to ${hr.email}:`, emailError);

          // Delete HR contact from the database if email fails
          await HR.deleteOne({ _id: hr._id });
          console.log(`🗑️ Deleted HR contact: ${hr.email}`);
        }

        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate 2 sec delay per email
      }

      console.log("✅ All emails sent successfully!");
    } catch (error) {
      console.error("❌ Email Sending Error:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  });
};

// API to Cancel Email Sending
const cancelEmailProcess = (req, res) => {
  isCancelled = true;
  res.json({ message: "Email sending process cancelled" });
};

module.exports = { sendEmails, cancelEmailProcess };
